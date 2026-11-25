import {
  extractGuideTitle,
  extractHtmlDocument,
  generateGeminiText,
} from "@/lib/viajes/gemini";
import {
  GUIDE_SYSTEM_PROMPT,
  JSON_SYSTEM_PROMPT,
  buildJsonUserPrompt,
  buildPlanUserPrompt,
} from "@/lib/viajes/prompts";
import { parseItineraryJson } from "@/lib/viajes/itinerary-schema";
import { isItineraryDenseEnough } from "@/lib/viajes/itinerary-quality";
import { renderGuideHtml } from "@/lib/viajes/render-guide";
import { isGuideComplete, sanitizeGuideHtml } from "@/lib/viajes/sanitize";
import { searchTravelContext } from "@/lib/viajes/tavily";
import { fetchDestinationImages, filterGuideImages } from "@/lib/viajes/wikimedia";
import { fetchActivityImageMap } from "@/lib/viajes/activity-images";
import { fetchTripVideos, type GuideVideo } from "@/lib/viajes/youtube";
import { buildBookingLinks } from "@/lib/viajes/booking-links";
import {
  allDestinations,
  citiesFromPlan,
  type GuideImage,
  type SearchSnippet,
  type TripPlanInput,
} from "@/lib/viajes/types";
import type { ActivityImageKey } from "@/lib/viajes/activity-images";

export type GeneratedGuide = {
  html: string;
  title: string;
  sources: SearchSnippet[];
  images: GuideImage[];
  videos: GuideVideo[];
  cities: string[];
  consultedAt: string;
  fallback: boolean;
  trip: TripPlanInput;
};

async function loadMediaForCities(
  cities: string[],
  interests: string[],
): Promise<{
  images: GuideImage[];
  videos: GuideVideo[];
}> {
  const targets = cities.slice(0, 4);
  const extras = [
    "skyline",
    "landmark",
    "street",
    "night",
    ...interests.slice(0, 2),
  ];
  const batches = await Promise.all(
    targets.map((d) => fetchDestinationImages(d, extras)),
  );
  let videos: GuideVideo[] = [];
  try {
    if (process.env.TAVILY_API_KEY) {
      videos = await fetchTripVideos(
        {
          origin: "",
          destination: targets[0] || "",
          destinations: targets.slice(1),
          dateMode: "flexible",
          luxury: 3,
          travelers: 1,
          interests: [],
          transport: "flexible",
          locale: "es",
        },
        targets,
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message === "TAVILY_QUOTA") throw err;
    console.warn("[viajes/generate] youtube", err);
  }
  return { images: filterGuideImages(batches.flat()), videos };
}

/** Full guide pipeline shared by /plan and /edit. */
export async function generateTravelGuide(
  input: TripPlanInput,
  opts?: { extraJsonHint?: string },
): Promise<GeneratedGuide> {
  const consultedAt = new Date().toISOString();
  const userLabels = allDestinations(input);

  let snippets: SearchSnippet[] = [];
  try {
    if (process.env.TAVILY_API_KEY) {
      snippets = await searchTravelContext(input);
    }
  } catch (err) {
    if (err instanceof Error && err.message === "TAVILY_QUOTA") throw err;
    console.warn("[viajes/generate] tavily", err);
  }

  let booking = buildBookingLinks(input);
  const nights = Math.max(
    1,
    (booking.stays || []).reduce((a, s) => a + s.nights, 0),
  );

  let html = "";
  let usedFallback = false;
  let images: GuideImage[] = [];
  let videos: GuideVideo[] = [];
  let activityImages = new Map<ActivityImageKey, GuideImage>();
  let resolvedCities = userLabels;

  const tryJsonPass = async (strictExtra: string) => {
    const rawJson = await generateGeminiText(
      JSON_SYSTEM_PROMPT,
      `${buildJsonUserPrompt({ input, snippets, consultedAt, booking })}\n${strictExtra}`,
      {
        temperature: 0.3,
        maxOutputTokens: 12288,
        attemptsPerModel: 2,
        maxModels: 3,
      },
    );
    return parseItineraryJson(rawJson);
  };

  try {
    let plan = await tryJsonPass(
      `\nResolve destinations for ANY place on Earth. User labels: ${userLabels.join(" · ")}. If a label is a country/region, pick 2–4 concrete cities and use ONLY those in stays[].city and days[].city.${opts?.extraJsonHint ? `\n${opts.extraJsonHint}` : ""}`,
    );

    if (plan) {
      const quality = isItineraryDenseEnough(plan, { nights });
      if (!quality.ok) {
        console.warn("[viajes/generate] thin itinerary:", quality.reason);
        const retry = await tryJsonPass(
          `\nPREVIOUS DRAFT REJECTED: ${quality.reason}. Output ALL ~${nights} days with ≥3 activities each. Cities must be concrete (not a country name). Include ALL user cities: ${userLabels.join(", ")}.`,
        );
        if (retry) {
          const q2 = isItineraryDenseEnough(retry, { nights });
          if (q2.ok || (retry.days?.length || 0) > (plan.days?.length || 0)) {
            plan = retry;
          }
        }
      }

      resolvedCities = citiesFromPlan(plan, userLabels).filter(
        (c) => c.toLowerCase() !== input.origin.trim().toLowerCase(),
      );
      if (resolvedCities.length === 0) resolvedCities = userLabels;

      booking = buildBookingLinks(input, resolvedCities);
      try {
        const [media, actMedia] = await Promise.all([
          loadMediaForCities(resolvedCities, input.interests),
          fetchActivityImageMap(plan),
        ]);
        activityImages = actMedia.byActivity;
        images = filterGuideImages([
          ...media.images,
          ...actMedia.cityFallbacks,
          ...[...actMedia.byActivity.values()],
        ]);
        videos = media.videos;
      } catch (mediaErr) {
        if (mediaErr instanceof Error && mediaErr.message === "TAVILY_QUOTA") {
          throw mediaErr;
        }
        console.warn("[viajes/generate] media", mediaErr);
      }

      html = sanitizeGuideHtml(
        renderGuideHtml({
          plan,
          images,
          videos,
          activityImages,
          consultedAt,
          destination: resolvedCities.join(" · ") || input.destination,
          origin: input.origin,
          locale: input.locale,
          travelers: input.travelers,
          luxury: input.luxury,
          booking,
        }),
      );
      usedFallback = true;
    }
  } catch (jsonErr) {
    if (jsonErr instanceof Error && jsonErr.message === "TAVILY_QUOTA") {
      throw jsonErr;
    }
    console.warn("[viajes/generate] json pass failed", jsonErr);
  }

  if (!html || html.length < 400) {
    try {
      if (images.length === 0) {
        const media = await loadMediaForCities(userLabels, input.interests);
        images = media.images;
        videos = media.videos;
      }
      const rawHtml = await generateGeminiText(
        GUIDE_SYSTEM_PROMPT,
        buildPlanUserPrompt({
          input,
          snippets,
          images,
          videos,
          consultedAt,
          booking,
        }),
        {
          temperature: 0.4,
          maxOutputTokens: 12288,
          attemptsPerModel: 1,
          maxModels: 2,
        },
      );
      const candidate = sanitizeGuideHtml(extractHtmlDocument(rawHtml));
      if (
        isGuideComplete(candidate, {
          minStays: Math.min(Math.max(resolvedCities.length, 1), 2),
        })
      ) {
        html = candidate;
        usedFallback = false;
      }
    } catch (htmlErr) {
      console.warn("[viajes/generate] html pass failed", htmlErr);
    }
  }

  if (!html || html.length < 200 || !/<html[\s>]/i.test(html)) {
    throw new Error("GENERATION_FAILED");
  }

  return {
    html,
    title: extractGuideTitle(html, `${input.destination} · ${input.origin}`),
    sources: snippets.slice(0, 24),
    images,
    videos,
    cities: resolvedCities,
    consultedAt,
    fallback: usedFallback,
    trip: {
      ...input,
      destination: resolvedCities[0] || input.destination,
      destinations: resolvedCities.slice(1),
    },
  };
}
