import { allDestinations } from "./types";
import type { TripPlanInput } from "./types";

function enc(s: string): string {
  return encodeURIComponent(s.trim());
}

function skyscannerDate(iso?: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${y.slice(2)}${m}${d}`;
}

/** Approximate ISO dates when user picked a flexible month. */
export function resolveTripDates(input: TripPlanInput): {
  start: string;
  end: string;
  nights: number;
} {
  if (input.dateMode === "exact" && input.startDate && input.endDate) {
    const a = new Date(`${input.startDate}T12:00:00`);
    const b = new Date(`${input.endDate}T12:00:00`);
    const nights = Math.max(
      1,
      Math.round((b.getTime() - a.getTime()) / 86400000),
    );
    return { start: input.startDate, end: input.endDate, nights };
  }

  const month = input.flexibleMonth || (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();
  const days = Math.max(
    input.daysMin ?? 4,
    Math.min(input.daysMax ?? 7, input.daysMax ?? 7),
  );
  const span = Math.max(input.daysMin ?? 4, Math.min(days, input.daysMax ?? days));
  const start = `${month}-12`;
  const startDt = new Date(`${start}T12:00:00`);
  const endDt = new Date(startDt.getTime() + (span - 1) * 86400000);
  const end = `${endDt.getFullYear()}-${String(endDt.getMonth() + 1).padStart(2, "0")}-${String(endDt.getDate()).padStart(2, "0")}`;
  return { start, end, nights: Math.max(1, span - 1) };
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function skyFlight(from: string, to: string, out?: string, ret?: string): string {
  const skyOut = skyscannerDate(out);
  const skyRet = skyscannerDate(ret);
  if (skyOut && skyRet) {
    return `https://www.skyscanner.es/transport/flights/${enc(from)}/${enc(to)}/${skyOut}/${skyRet}/`;
  }
  if (skyOut) {
    return `https://www.skyscanner.es/transport/flights/${enc(from)}/${enc(to)}/${skyOut}/`;
  }
  return `https://www.skyscanner.es/transport/flights/${enc(from)}/${enc(to)}/`;
}

function googleFlight(from: string, to: string, out?: string, ret?: string, adults = 1): string {
  const q = [
    `Flights from ${from} to ${to}`,
    out ? `on ${out}` : "",
    ret ? `returning ${ret}` : "",
    adults > 1 ? `${adults} adults` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `https://www.google.com/travel/flights?q=${enc(q)}`;
}

function flix(from: string, to: string): string {
  return `https://www.flixbus.es/bus/${enc(from.toLowerCase())}/${enc(to.toLowerCase())}`;
}

function trainline(from: string, to: string, date?: string): string {
  const base = `https://www.thetrainline.com/book/results?originName=${enc(from)}&destinationName=${enc(to)}`;
  return date ? `${base}&outwardDate=${enc(date)}` : base;
}

/** Search Booking for a property (name + city) or city-only fallback. */
function bookingHotel(
  place: string,
  checkin: string,
  checkout: string,
  adults: number,
): string {
  return `https://www.booking.com/searchresults.es.html?ss=${enc(place)}&checkin=${enc(checkin)}&checkout=${enc(checkout)}&group_adults=${adults}&no_rooms=1&selected_currency=EUR&order=relevance`;
}

function airbnbHotel(
  city: string,
  checkin: string,
  checkout: string,
  adults: number,
  property?: string,
): string {
  const base = `https://www.airbnb.es/s/${enc(city)}/homes?checkin=${enc(checkin)}&checkout=${enc(checkout)}&adults=${adults}`;
  return property ? `${base}&query=${enc(property)}` : base;
}

/** Deep-link toward a named stay (hotel/apartment) for the given city window. */
export function stayBookingHref(opts: {
  platform: "booking" | "airbnb";
  name?: string;
  city: string;
  checkin: string;
  checkout: string;
  adults: number;
}): string {
  const label = [opts.name?.trim(), opts.city.trim()].filter(Boolean).join(", ");
  if (opts.platform === "airbnb") {
    return airbnbHotel(
      opts.city,
      opts.checkin,
      opts.checkout,
      opts.adults,
      opts.name,
    );
  }
  return bookingHotel(label || opts.city, opts.checkin, opts.checkout, opts.adults);
}

export type LegBookingLink = {
  from: string;
  to: string;
  date: string;
  label: string;
  skyscanner: string;
  google: string;
  flixbus: string;
  trainline: string;
};

export type CityStayLink = {
  city: string;
  checkin: string;
  checkout: string;
  nights: number;
  booking: string;
  airbnb: string;
  getYourGuide: string;
};

function getYourGuide(city: string): string {
  return `https://www.getyourguide.com/s/?q=${enc(city)}&searchSource=2`;
}

/** Public deep-links (no paid API) for “buy / book” CTAs.
 * Pass `cityOverride` with concrete cities from the AI plan for any country/region. */
export function buildBookingLinks(
  input: TripPlanInput,
  cityOverride?: string[],
) {
  const from = input.origin;
  const dests =
    cityOverride && cityOverride.length > 0
      ? [...new Set(cityOverride.map((c) => c.trim()).filter(Boolean))]
      : allDestinations(input);
  const to = dests[0] || input.destination;
  const adults = Math.max(1, input.travelers || 1);
  const { start, end, nights } = resolveTripDates(input);

  const cities = [from, ...dests];
  // Split nights roughly across destinations for lodging windows
  const perCityNights = Math.max(1, Math.floor(nights / Math.max(dests.length, 1)));
  const stays: CityStayLink[] = [];
  let cursor = start;
  dests.forEach((city, i) => {
    const isLast = i === dests.length - 1;
    const cityNights = isLast
      ? Math.max(1, nights - perCityNights * (dests.length - 1))
      : perCityNights;
    const checkin = cursor;
    const checkout = addDays(checkin, cityNights);
    stays.push({
      city,
      checkin,
      checkout,
      nights: cityNights,
      booking: bookingHotel(city, checkin, checkout, adults),
      airbnb: airbnbHotel(city, checkin, checkout, adults),
      getYourGuide: getYourGuide(city),
    });
    cursor = checkout;
  });

  const legs: LegBookingLink[] = [];
  // outbound origin → first dest
  legs.push({
    from,
    to: dests[0] || to,
    date: start,
    label: "IDA",
    skyscanner: skyFlight(from, dests[0] || to, start),
    google: googleFlight(from, dests[0] || to, start, undefined, adults),
    flixbus: flix(from, dests[0] || to),
    trainline: trainline(from, dests[0] || to, start),
  });
  // between destinations
  for (let i = 0; i < dests.length - 1; i++) {
    const legDate = stays[i]?.checkout || addDays(start, (i + 1) * perCityNights);
    legs.push({
      from: dests[i],
      to: dests[i + 1],
      date: legDate,
      label: `TRAMO ${i + 1}`,
      skyscanner: skyFlight(dests[i], dests[i + 1], legDate),
      google: googleFlight(dests[i], dests[i + 1], legDate, undefined, adults),
      flixbus: flix(dests[i], dests[i + 1]),
      trainline: trainline(dests[i], dests[i + 1], legDate),
    });
  }
  // return last → origin
  legs.push({
    from: dests[dests.length - 1] || to,
    to: from,
    date: end,
    label: "VUELTA",
    skyscanner: skyFlight(dests[dests.length - 1] || to, from, end),
    google: googleFlight(dests[dests.length - 1] || to, from, end, undefined, adults),
    flixbus: flix(dests[dests.length - 1] || to, from),
    trainline: trainline(dests[dests.length - 1] || to, from, end),
  });

  const googleFlightsQ = [
    dests.length > 1
      ? `Flights ${cities.join(" to ")}`
      : `Flights from ${from} to ${to}`,
    `on ${start}`,
    `returning ${end}`,
    adults > 1 ? `${adults} adults` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    flightsGoogle: `https://www.google.com/travel/flights?q=${enc(googleFlightsQ)}`,
    flightsSkyscanner: skyFlight(from, to, start, end),
    hotelsBooking: stays[0]?.booking || bookingHotel(to, start, end, adults),
    hotelsAirbnb: stays[0]?.airbnb || airbnbHotel(to, start, end, adults),
    activitiesGetYourGuide: `https://www.getyourguide.com/s/?q=${enc(to)}&searchSource=2`,
    busFlixbus: flix(from, to),
    trainsTrainline: trainline(from, to, start),
    legs,
    stays,
    tripStart: start,
    tripEnd: end,
  };
}

export type BookingLinks = ReturnType<typeof buildBookingLinks>;
