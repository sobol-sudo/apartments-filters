import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRICE_MAX,
  DEFAULT_PRICE_MIN,
  DEFAULT_SQUARE_MAX,
  DEFAULT_SQUARE_MIN,
  extractRoomsCount,
  normalizePersistedFilters,
} from "~/entities/apartment/model/filters";
import { apartmentsItems } from "~/entities/apartment/mock";

describe("extractRoomsCount", () => {
  it("reads the bedroom count out of a listing title", () => {
    expect(extractRoomsCount("1-bedroom, unit 101")).toBe(1);
    expect(extractRoomsCount("3-bedroom, unit 108")).toBe(3);
  });

  it("reads counts longer than one digit", () => {
    expect(extractRoomsCount("12-bedroom, unit 1")).toBe(12);
  });

  it("does not mistake the unit number for a bedroom count", () => {
    // The unit number is the only number in the string. Anything looser than
    // "<n>-bedroom" turns unit 302 into a 302-bedroom apartment, which would
    // then show up as a chip in the sidebar.
    expect(extractRoomsCount("Studio, unit 302")).toBe(0);
    expect(extractRoomsCount("Penthouse")).toBe(0);
    expect(extractRoomsCount("")).toBe(0);
  });

  it("parses every title the catalogue actually ships", () => {
    // The parser reads display text, so it silently returns 0 for the whole
    // catalogue the day the titles are reworded. That would empty the sidebar
    // chips and make the bedroom filter match nothing, with no error anywhere.
    const counts = apartmentsItems.map((item) => extractRoomsCount(item.title));

    expect(counts.filter((count) => count === 0)).toEqual([]);
    expect([...new Set(counts)].sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });
});

describe("normalizePersistedFilters", () => {
  const saved = {
    filters: {
      rooms: [2],
      priceRange: [6000000, 9000000],
      squareRange: [40, 60],
    },
    sortBy: "price_desc",
  };

  it("keeps a well-formed saved value", () => {
    expect(normalizePersistedFilters(saved)).toEqual({
      filters: {
        rooms: [2],
        priceRange: [6000000, 9000000],
        squareRange: [40, 60],
      },
      sortBy: "price_desc",
    });
  });

  it("rejects anything that is not a saved filter payload", () => {
    const rubbish = [
      null,
      undefined,
      0,
      42,
      "apartments-filters",
      "",
      [],
      {},
      { filters: null },
      { filters: "rooms=2" },
      { filters: [] as unknown },
    ];

    for (const value of rubbish) {
      expect(normalizePersistedFilters(value)).toBeNull();
    }
  });

  it("rejects ranges that are not a pair of finite numbers", () => {
    const broken = [
      { ...saved, filters: { ...saved.filters, priceRange: ["6000000", "9"] } },
      { ...saved, filters: { ...saved.filters, priceRange: [6000000] } },
      { ...saved, filters: { ...saved.filters, priceRange: [6e6, 9e6, 1e6] } },
      { ...saved, filters: { ...saved.filters, priceRange: [Number.NaN, 9e6] } },
      { ...saved, filters: { ...saved.filters, priceRange: [6e6, Infinity] } },
      { ...saved, filters: { ...saved.filters, squareRange: null } },
      { ...saved, filters: { ...saved.filters, squareRange: "40-60" } },
    ];

    for (const value of broken) {
      expect(normalizePersistedFilters(value)).toBeNull();
    }
  });

  it("rejects bedroom counts that are not positive integers", () => {
    const broken = [
      { ...saved, filters: { ...saved.filters, rooms: "2" } },
      { ...saved, filters: { ...saved.filters, rooms: [0] } },
      { ...saved, filters: { ...saved.filters, rooms: [-2] } },
      { ...saved, filters: { ...saved.filters, rooms: [1.5] } },
      { ...saved, filters: { ...saved.filters, rooms: ["2"] } },
      { ...saved, filters: { ...saved.filters, rooms: [null] } },
      { ...saved, filters: { ...saved.filters, rooms: [2, "3"] } },
    ];

    for (const value of broken) {
      expect(normalizePersistedFilters(value)).toBeNull();
    }
  });

  it("pulls an out-of-bounds range back inside the allowed bounds", () => {
    const result = normalizePersistedFilters({
      ...saved,
      filters: {
        ...saved.filters,
        priceRange: [0, 999999999],
        squareRange: [-10, 5000],
      },
    });

    expect(result?.filters.priceRange).toEqual([
      DEFAULT_PRICE_MIN,
      DEFAULT_PRICE_MAX,
    ]);
    expect(result?.filters.squareRange).toEqual([
      DEFAULT_SQUARE_MIN,
      DEFAULT_SQUARE_MAX,
    ]);
  });

  it("puts a reversed range back in order so the list cannot be stuck empty", () => {
    // A cookie can be hand-edited. "from 18.9M to 5.5M" matches nothing and
    // there is no control on the page that can undo it except a full reset.
    const result = normalizePersistedFilters({
      ...saved,
      filters: {
        ...saved.filters,
        priceRange: [DEFAULT_PRICE_MAX, DEFAULT_PRICE_MIN],
        squareRange: [DEFAULT_SQUARE_MAX, DEFAULT_SQUARE_MIN],
      },
    });

    expect(result?.filters.priceRange).toEqual([
      DEFAULT_PRICE_MIN,
      DEFAULT_PRICE_MAX,
    ]);
    expect(result?.filters.squareRange).toEqual([
      DEFAULT_SQUARE_MIN,
      DEFAULT_SQUARE_MAX,
    ]);
  });

  it("drops duplicate bedroom counts", () => {
    const result = normalizePersistedFilters({
      ...saved,
      filters: { ...saved.filters, rooms: [2, 2, 3, 2] },
    });

    expect(result?.filters.rooms).toEqual([2, 3]);
  });

  it("falls back to the default sort when the saved one is unknown", () => {
    for (const sortBy of ["price_up", "", null, 7, "PRICE_DESC"]) {
      expect(normalizePersistedFilters({ ...saved, sortBy })?.sortBy).toBe(
        "default"
      );
    }

    expect(normalizePersistedFilters({ ...saved, sortBy: "floor_desc" })?.sortBy).toBe(
      "floor_desc"
    );
  });
});
