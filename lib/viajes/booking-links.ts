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

/** Public deep-links (no paid API) for “buy / book” CTAs. */
export function buildBookingLinks(input: TripPlanInput) {
  const from = input.origin;
  const dests = allDestinations(input);
  const to = dests[0] || input.destination;
  const adults = Math.max(1, input.travelers || 1);
  const out = input.startDate || "";
  const ret = input.endDate || "";

  const googleFlightsQ = [
    dests.length > 1
      ? `Multi-city flights ${from} ${dests.join(" ")}`
      : `Flights from ${from} to ${to}`,
    out ? `on ${out}` : "",
    ret ? `returning ${ret}` : "",
    adults > 1 ? `${adults} adults` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const skyOut = skyscannerDate(out);
  const skyRet = skyscannerDate(ret);
  const skyPath =
    skyOut && skyRet
      ? `https://www.skyscanner.es/transport/flights-from/${enc(from)}/${enc(to)}/${skyOut}/${skyRet}/`
      : `https://www.skyscanner.es/transport/flights-from/${enc(from)}/${enc(to)}/`;

  const bookingCheckin = out || "";
  const bookingCheckout = ret || "";
  const booking =
    bookingCheckin && bookingCheckout
      ? `https://www.booking.com/searchresults.es.html?ss=${enc(to)}&checkin=${enc(bookingCheckin)}&checkout=${enc(bookingCheckout)}&group_adults=${adults}&no_rooms=1`
      : `https://www.booking.com/searchresults.es.html?ss=${enc(to)}&group_adults=${adults}`;

  const airbnb =
    bookingCheckin && bookingCheckout
      ? `https://www.airbnb.es/s/${enc(to)}/homes?checkin=${enc(bookingCheckin)}&checkout=${enc(bookingCheckout)}&adults=${adults}`
      : `https://www.airbnb.es/s/${enc(to)}/homes?adults=${adults}`;

  const gyg = `https://www.getyourguide.com/s/?q=${enc(to)}&searchSource=2`;
  const flix = `https://www.flixbus.es/?departureCity=${enc(from)}&arrivalCity=${enc(to)}`;
  const trainline = `https://www.thetrainline.com/`;

  return {
    flightsGoogle: `https://www.google.com/travel/flights?q=${enc(googleFlightsQ)}`,
    flightsSkyscanner: skyPath,
    hotelsBooking: booking,
    hotelsAirbnb: airbnb,
    activitiesGetYourGuide: gyg,
    busFlixbus: flix,
    trainsTrainline: trainline,
  };
}

export type BookingLinks = ReturnType<typeof buildBookingLinks>;
