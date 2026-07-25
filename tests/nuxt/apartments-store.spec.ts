// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { apartmentsItems } from "~/entities/apartment/mock";
import { useApartmentsStore } from "~/entities/apartment/model/store";
import {
  DEFAULT_PRICE_MAX,
  DEFAULT_PRICE_MIN,
  DEFAULT_SQUARE_MAX,
  DEFAULT_SQUARE_MIN,
  type PersistedFilters,
} from "~/entities/apartment/model/filters";

const COOKIE_NAME = "apartments-filters";
const DEFAULT_PRICE: [number, number] = [DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX];
const DEFAULT_SQUARE: [number, number] = [
  DEFAULT_SQUARE_MIN,
  DEFAULT_SQUARE_MAX,
];

// The endpoint the store talks to. Swapped per test where the scenario needs a
// different catalogue, restored afterwards.
let catalogue = apartmentsItems;

registerEndpoint("/api/apartments", () => catalogue);

const clearSavedFilters = (): void => {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
};

const writeSavedFilters = (raw: string): void => {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(raw)}; path=/`;
};

const readSavedFilters = (): PersistedFilters | null => {
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));

  if (!entry) return null;

  return JSON.parse(decodeURIComponent(entry.slice(COOKIE_NAME.length + 1)));
};

// A fresh store on a fresh pinia, i.e. what a new visit to the page gets.
// Whatever is in document.cookie at this point is what the visitor brings.
const openPage = async () => {
  setActivePinia(createPinia());
  const store = useApartmentsStore();
  await store.fetchApartments();
  return store;
};

const titles = (items: { title: string }[]) => items.map((item) => item.title);

describe("apartments store", () => {
  beforeEach(() => {
    clearSavedFilters();
  });

  afterEach(() => {
    vi.useRealTimers();
    catalogue = apartmentsItems;
    clearSavedFilters();
  });

  describe("a reset while a slider commit is still queued", () => {
    it("does not let the queued commit undo the reset", async () => {
      const store = await openPage();

      // Only setTimeout is faked: the debounce and nothing else. Promises and
      // Vue's scheduler keep running normally.
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

      // The drag from the bug report: a price range that matches nothing.
      store.setPriceRange([17556642, DEFAULT_PRICE_MAX]);
      expect(store.filters.priceRange).toEqual([17556642, DEFAULT_PRICE_MAX]);

      // Reset lands inside the debounce window, before the drag is committed.
      store.resetFilters();

      expect(store.filters.priceRange).toEqual(DEFAULT_PRICE);
      expect(store.filteredApartments).toHaveLength(15);
      expect(store.displayedApartments).toHaveLength(5);

      // Wait out the debounce: this is where the reset used to be undone, on
      // screen and in the saved copy.
      vi.advanceTimersByTime(1000);

      expect(store.filters.priceRange).toEqual(DEFAULT_PRICE);
      expect(store.filteredApartments).toHaveLength(15);
      expect(store.displayedApartments).toHaveLength(5);

      vi.useRealTimers();
      await nextTick();

      // And the next visit gets the reset filters, not the abandoned drag.
      expect(readSavedFilters()?.filters.priceRange).toEqual(DEFAULT_PRICE);
    });

    it("cancels the queued commit rather than firing it late", async () => {
      const store = await openPage();

      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

      store.setPriceRange([17556642, DEFAULT_PRICE_MAX]);
      store.resetFilters();

      // Paging on is the cheapest way to see a stale commit arrive: applying
      // filters snaps the list back to page one.
      store.loadMore();
      expect(store.displayedApartments).toHaveLength(10);

      vi.advanceTimersByTime(1000);

      expect(store.displayedApartments).toHaveLength(10);
    });

    it("commits the drag when nothing interrupts it", async () => {
      const store = await openPage();

      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

      store.setPriceRange([DEFAULT_PRICE_MIN, 6000000]);
      expect(store.filteredApartments).toHaveLength(15);

      vi.advanceTimersByTime(300);

      expect(store.filteredApartments.map((item) => item.price)).toEqual([
        5800000, 5900000,
      ]);
    });
  });

  describe("filtering", () => {
    it("derives the bedroom chips from the catalogue", async () => {
      const store = await openPage();

      expect(store.rooms.map((room) => room.name)).toEqual([
        "1BR",
        "2BR",
        "3BR",
      ]);
      expect(store.rooms.map((room) => room.active)).toEqual([
        false,
        false,
        false,
      ]);

      store.toggleRoom(2);

      expect(store.rooms.map((room) => room.active)).toEqual([
        false,
        true,
        false,
      ]);
    });

    it("matches a bedroom chip against the bedroom count", async () => {
      const store = await openPage();

      store.toggleRoom(2);

      expect(store.filteredApartments).toHaveLength(5);
      expect(
        titles(store.filteredApartments).every((title) =>
          title.startsWith("2-bedroom")
        )
      ).toBe(true);

      store.toggleRoom(2);

      expect(store.filteredApartments).toHaveLength(15);
    });

    it("keeps an apartment sitting exactly on a range boundary", async () => {
      const store = await openPage();

      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

      store.setPriceRange([5800000, 5800000]);
      vi.advanceTimersByTime(300);

      expect(titles(store.filteredApartments)).toEqual([
        "1-bedroom, unit 101",
      ]);

      store.setPriceRange(DEFAULT_PRICE);
      store.setSquareRange([63.1, 63.1]);
      vi.advanceTimersByTime(300);

      expect(titles(store.filteredApartments)).toEqual([
        "3-bedroom, unit 104",
        "3-bedroom, unit 108",
      ]);
    });

    it("sorts by bedroom count, price, area and floor", async () => {
      const store = await openPage();

      store.setSortBy("rooms_desc");
      expect(titles(store.filteredApartments)[0]).toBe("3-bedroom, unit 104");

      store.setSortBy("rooms_asc");
      expect(titles(store.filteredApartments)[0]).toBe("1-bedroom, unit 101");

      store.setSortBy("price_desc");
      expect(store.filteredApartments[0]?.price).toBe(9500000);

      store.setSortBy("square_asc");
      expect(store.filteredApartments[0]?.square).toBe(35.5);

      store.setSortBy("floor_desc");
      expect(store.filteredApartments[0]?.floor).toBe(10);

      store.setSortBy("default");
      expect(titles(store.filteredApartments)).toEqual(titles(apartmentsItems));
    });
  });

  describe("saved filters", () => {
    it("reads back the filters it saved on the previous visit", async () => {
      const first = await openPage();

      first.toggleRoom(3);
      first.setSortBy("price_desc");
      await nextTick();

      const second = await openPage();

      expect(second.filters.rooms).toEqual([3]);
      expect(second.sortBy).toBe("price_desc");
      // The five 3-bedroom units, most expensive first.
      expect(second.filteredApartments.map((item) => item.price)).toEqual([
        6679554, 6671314, 6650759, 6650759, 6630500,
      ]);
    });

    it("drops a saved bedroom filter the catalogue no longer offers", async () => {
      writeSavedFilters(
        JSON.stringify({
          filters: {
            rooms: [4],
            priceRange: DEFAULT_PRICE,
            squareRange: DEFAULT_SQUARE,
          },
          sortBy: "default",
        })
      );

      const store = await openPage();

      expect(store.filters.rooms).toEqual([]);
      expect(store.rooms.map((room) => room.value)).toEqual([1, 2, 3]);
      expect(store.filteredApartments).toHaveLength(15);
      expect(store.isEmpty).toBe(false);
    });

    it("cannot be locked into an empty list by a hand-edited cookie", async () => {
      writeSavedFilters(
        JSON.stringify({
          filters: {
            rooms: [2],
            // Reversed, and far outside the slider bounds.
            priceRange: [DEFAULT_PRICE_MAX, 0],
            squareRange: [9999, -5],
          },
          sortBy: "cheapest-first",
        })
      );

      const store = await openPage();

      expect(store.filters.priceRange).toEqual(DEFAULT_PRICE);
      expect(store.filters.squareRange).toEqual(DEFAULT_SQUARE);
      expect(store.sortBy).toBe("default");
      expect(store.filters.rooms).toEqual([2]);
      expect(store.filteredApartments).toHaveLength(5);
      expect(store.isEmpty).toBe(false);
    });

    it("falls back to the defaults when the saved value is corrupted", async () => {
      for (const raw of [
        "not json at all {{{",
        "null",
        "[]",
        '{"filters":{"rooms":"2"}}',
        '{"filters":{"rooms":[2],"priceRange":[6000000]}}',
      ]) {
        clearSavedFilters();
        writeSavedFilters(raw);

        const store = await openPage();

        expect(store.filters.rooms).toEqual([]);
        expect(store.filters.priceRange).toEqual(DEFAULT_PRICE);
        expect(store.filters.squareRange).toEqual(DEFAULT_SQUARE);
        expect(store.sortBy).toBe("default");
        expect(store.displayedApartments).toHaveLength(5);
      }
    });

    it("still filters when the browser refuses to store cookies", async () => {
      const original = Object.getOwnPropertyDescriptor(document, "cookie");

      // What a browser with cookies switched off does: reads come back empty,
      // writes are dropped on the floor. Nothing throws.
      Object.defineProperty(document, "cookie", {
        configurable: true,
        get: () => "",
        set: () => {},
      });

      try {
        const store = await openPage();

        expect(store.filters.rooms).toEqual([]);
        expect(store.filters.priceRange).toEqual(DEFAULT_PRICE);

        store.toggleRoom(2);
        expect(store.filteredApartments).toHaveLength(5);

        store.resetFilters();
        expect(store.filteredApartments).toHaveLength(15);
      } finally {
        if (original) {
          Object.defineProperty(document, "cookie", original);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (document as any).cookie;
        }
      }
    });
  });

  describe("empty states", () => {
    it("does not call an unloaded catalogue empty", async () => {
      setActivePinia(createPinia());
      const store = useApartmentsStore();

      expect(store.isEmpty).toBe(false);
      expect(store.hasNoData).toBe(false);

      await store.fetchApartments();

      expect(store.isEmpty).toBe(false);
      expect(store.hasNoData).toBe(false);
    });

    it("reports an empty result set once the filters exclude everything", async () => {
      const store = await openPage();

      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

      store.setSquareRange([120, DEFAULT_SQUARE_MAX]);
      vi.advanceTimersByTime(300);

      expect(store.filteredApartments).toHaveLength(0);
      expect(store.isEmpty).toBe(true);
      expect(store.hasNoData).toBe(false);
    });

    it("reports an empty catalogue as a different state from an empty result", async () => {
      catalogue = [];

      const store = await openPage();

      expect(store.hasNoData).toBe(true);
      expect(store.isEmpty).toBe(false);
      expect(store.rooms).toEqual([]);
      expect(store.totalFloors).toBe(0);
    });
  });
});
