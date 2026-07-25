import { type apartmentsItem } from "../types";

// Both endpoints are Nitro routes in this repo. During SSR Nuxt resolves them
// in-process, so a server render costs a function call rather than a round trip;
// in the browser they are ordinary HTTP requests that can genuinely fail, which
// is what the error and retry states are there for.
export const getApartments = (): Promise<apartmentsItem[]> =>
  $fetch<apartmentsItem[]>("/api/apartments");

export const getApartment = (id: number | string): Promise<apartmentsItem> =>
  $fetch<apartmentsItem>(`/api/apartments/${id}`);
