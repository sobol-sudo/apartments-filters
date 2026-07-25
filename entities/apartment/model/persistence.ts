import type { PersistedFilters } from "./filters";

// Saved filters live in a cookie rather than in localStorage on purpose.
//
// The apartment list is rendered on the server, and the server only sees what
// the browser sends with the request. localStorage is client-only, so a
// returning visitor would get the unfiltered catalogue in the HTML and watch it
// change under them once hydration ran. A cookie is readable on both sides, so
// the server renders exactly what the client is about to render.
const FILTERS_COOKIE_KEY = "apartments-filters";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export const useFiltersCookie = () =>
  useCookie<PersistedFilters | null>(FILTERS_COOKIE_KEY, {
    default: () => null,
    path: "/",
    sameSite: "lax",
    maxAge: ONE_YEAR_IN_SECONDS,
  });
