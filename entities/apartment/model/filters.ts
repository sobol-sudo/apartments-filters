// Filter vocabulary, defaults and validation.
//
// Kept apart from the store so that the server, the store and the persistence
// layer all agree on the same shape without importing each other in a circle.

export const SORT_OPTIONS = [
  "default",
  "rooms_asc",
  "rooms_desc",
  "price_asc",
  "price_desc",
  "square_asc",
  "square_desc",
  "floor_asc",
  "floor_desc",
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

export interface FilterState {
  rooms: number[];
  priceRange: [number, number];
  squareRange: [number, number];
}

export interface PersistedFilters {
  filters: FilterState;
  sortBy: SortOption;
}

export interface RoomOption {
  name: string;
  value: number;
  active: boolean;
}

export const DEFAULT_PRICE_MIN = 5500000;
export const DEFAULT_PRICE_MAX = 18900000;
export const DEFAULT_SQUARE_MIN = 33;
export const DEFAULT_SQUARE_MAX = 123;
export const PRICE_STEP = 100000;
export const SQUARE_STEP = 1;

export const createDefaultFilters = (): FilterState => ({
  rooms: [],
  priceRange: [DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX],
  squareRange: [DEFAULT_SQUARE_MIN, DEFAULT_SQUARE_MAX],
});

// Pulls the bedroom count out of an apartment title, e.g. "2-bedroom, unit 102" -> 2
export const extractRoomsCount = (title: string): number => {
  const match = title.match(/(\d+)-bedroom/);
  return match ? parseInt(match[1], 10) : 0;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const isNumericPair = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((entry) => typeof entry === "number" && Number.isFinite(entry));

// A hand-edited or truncated range must never be able to lock the catalogue
// into a permanent empty state, so pull it back inside the allowed bounds and
// put the two ends in the right order.
const normalizeRange = (
  range: [number, number],
  min: number,
  max: number
): [number, number] => {
  const low = clamp(range[0], min, max);
  const high = clamp(range[1], min, max);

  return low <= high ? [low, high] : [high, low];
};

const isSortOption = (value: unknown): value is SortOption =>
  SORT_OPTIONS.includes(value as SortOption);

// The persisted value travels in a cookie, which anyone can edit by hand, so it
// is treated as untrusted input: unknown shapes fall back to the defaults.
export const normalizePersistedFilters = (
  value: unknown
): PersistedFilters | null => {
  if (typeof value !== "object" || value === null) return null;

  const candidate = (value as { filters?: unknown }).filters;

  if (typeof candidate !== "object" || candidate === null) return null;

  const { rooms, priceRange, squareRange } = candidate as Record<
    string,
    unknown
  >;

  if (
    !Array.isArray(rooms) ||
    !rooms.every((room) => Number.isInteger(room) && (room as number) > 0) ||
    !isNumericPair(priceRange) ||
    !isNumericPair(squareRange)
  ) {
    return null;
  }

  const sortBy = (value as { sortBy?: unknown }).sortBy;

  return {
    filters: {
      rooms: [...new Set(rooms as number[])],
      priceRange: normalizeRange(
        priceRange,
        DEFAULT_PRICE_MIN,
        DEFAULT_PRICE_MAX
      ),
      squareRange: normalizeRange(
        squareRange,
        DEFAULT_SQUARE_MIN,
        DEFAULT_SQUARE_MAX
      ),
    },
    sortBy: isSortOption(sortBy) ? sortBy : "default",
  };
};
