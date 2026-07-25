import type { apartmentsItem } from "../types";
import { getApartments } from "../api";
import { debounce } from "~/shareds/lib/debounce";
import { useFiltersCookie } from "./persistence";
import {
  createDefaultFilters,
  extractRoomsCount,
  normalizePersistedFilters,
  type FilterState,
  type RoomOption,
  type SortOption,
} from "./filters";

const ITEMS_PER_PAGE = 5;
// Slider drags are committed on a debounce so a drag does not refilter the list
// on every frame.
const FILTER_COMMIT_DELAY = 300;

const toErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

export const useApartmentsStore = defineStore("apartments", () => {
  // Read on both sides of the render: on the server from the request cookie, in
  // the browser from document.cookie. Both arrive at the same filter state, so
  // the server-rendered markup already matches what hydration produces.
  const persistedFilters = useFiltersCookie();
  const restored = normalizePersistedFilters(persistedFilters.value);

  const allApartments = ref<apartmentsItem[]>([]);
  const displayedApartments = ref<apartmentsItem[]>([]);
  const filteredApartments = ref<apartmentsItem[]>([]);
  const currentPage = ref(1);
  const itemsPerPage = ref(ITEMS_PER_PAGE);
  const isLoading = ref(false);
  // Kept as a plain string: an Error instance cannot be serialized into the
  // Nuxt payload, which would turn a failed server-side fetch into a 500
  const error = ref<string | null>(null);
  const hasInitialized = ref(false);

  const filters = ref<FilterState>(restored?.filters ?? createDefaultFilters());
  const sortBy = ref<SortOption>(restored?.sortBy ?? "default");

  // Chips are derived from the data instead of being hard-coded, so the sidebar
  // can only ever offer bedroom counts the catalogue actually contains.
  const rooms = computed<RoomOption[]>(() => {
    const available = new Set<number>();

    allApartments.value.forEach((apartment) => {
      const count = extractRoomsCount(apartment.title);
      if (count > 0) available.add(count);
    });

    return [...available]
      .sort((a, b) => a - b)
      .map((value) => ({
        name: `${value}BR`,
        value,
        active: filters.value.rooms.includes(value),
      }));
  });

  const totalFloors = computed(() =>
    allApartments.value.reduce(
      (highest, apartment) => Math.max(highest, apartment.floor),
      0
    )
  );

  const hasMoreItems = computed(
    () => displayedApartments.value.length < filteredApartments.value.length
  );

  const isEmpty = computed(
    () =>
      hasInitialized.value &&
      !isLoading.value &&
      allApartments.value.length > 0 &&
      filteredApartments.value.length === 0
  );

  const hasNoData = computed(
    () =>
      hasInitialized.value &&
      !isLoading.value &&
      allApartments.value.length === 0
  );

  const saveFilters = (): void => {
    persistedFilters.value = {
      filters: {
        rooms: [...filters.value.rooms],
        priceRange: [...filters.value.priceRange],
        squareRange: [...filters.value.squareRange],
      },
      sortBy: sortBy.value,
    };
  };

  const sortMapper: Record<
    SortOption,
    (a: apartmentsItem, b: apartmentsItem) => number
  > = {
    default: () => 0,
    rooms_asc: (a, b) => extractRoomsCount(a.title) - extractRoomsCount(b.title),
    rooms_desc: (a, b) =>
      extractRoomsCount(b.title) - extractRoomsCount(a.title),
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    square_asc: (a, b) => a.square - b.square,
    square_desc: (a, b) => b.square - a.square,
    floor_asc: (a, b) => a.floor - b.floor,
    floor_desc: (a, b) => b.floor - a.floor,
  };

  const filterApartments = (apartments: apartmentsItem[]): apartmentsItem[] =>
    apartments.filter((apartment) => {
      // Bedrooms
      if (filters.value.rooms.length > 0) {
        const roomsCount = extractRoomsCount(apartment.title);
        if (!filters.value.rooms.includes(roomsCount)) return false;
      }

      // Price
      const [priceMin, priceMax] = filters.value.priceRange;
      if (apartment.price < priceMin || apartment.price > priceMax) return false;

      // Area
      const [squareMin, squareMax] = filters.value.squareRange;
      if (apartment.square < squareMin || apartment.square > squareMax) {
        return false;
      }

      return true;
    });

  const sortApartments = (
    apartments: apartmentsItem[],
    sortOption: SortOption
  ): apartmentsItem[] =>
    sortOption === "default"
      ? [...apartments]
      : [...apartments].sort(sortMapper[sortOption]);

  const applyFiltersAndSort = (): void => {
    filteredApartments.value = sortApartments(
      filterApartments(allApartments.value),
      sortBy.value
    );
    currentPage.value = 1;
    displayedApartments.value = filteredApartments.value.slice(
      0,
      itemsPerPage.value
    );
  };

  // Deliberately argument-free: it re-reads the live filter state instead of
  // closing over the values captured when the drag happened, so a queued commit
  // can never write back a range the user has already moved on from.
  const commitFilters = debounce(() => {
    applyFiltersAndSort();
    saveFilters();
  }, FILTER_COMMIT_DELAY);

  // Every action that applies filters straight away first drops whatever the
  // sliders have queued. Without this a pending drag lands after a reset and
  // silently undoes it, in the persisted copy as well as on screen.
  const commitNow = (): void => {
    commitFilters.cancel();
    applyFiltersAndSort();
    saveFilters();
  };

  const fetchApartments = async (): Promise<void> => {
    if (allApartments.value.length > 0) return;

    isLoading.value = true;
    error.value = null;

    try {
      const data = await getApartments();
      allApartments.value = data;
      hasInitialized.value = true;

      // A saved bedroom filter can outlive the listing it referred to. Dropping
      // counts the catalogue no longer has keeps the chips and the results in
      // agreement instead of showing an empty list with nothing highlighted.
      const available = new Set(
        data.map((apartment) => extractRoomsCount(apartment.title))
      );
      filters.value.rooms = filters.value.rooms.filter((room) =>
        available.has(room)
      );

      applyFiltersAndSort();
    } catch (err) {
      error.value = toErrorMessage(err);
      console.error("Error fetching apartments:", err);
    } finally {
      isLoading.value = false;
    }
  };

  // Clears the error so the error block can disappear. Data that already
  // arrived is kept; only a genuinely empty store is refetched.
  const retryFetch = async (): Promise<void> => {
    if (isLoading.value) return;

    error.value = null;

    if (allApartments.value.length > 0) {
      applyFiltersAndSort();
      return;
    }

    await fetchApartments();
  };

  // The whole catalogue is already in memory, so revealing the next page is a
  // slice rather than a request.
  const loadMore = (): void => {
    if (!hasMoreItems.value) return;

    currentPage.value++;
    displayedApartments.value = filteredApartments.value.slice(
      0,
      currentPage.value * itemsPerPage.value
    );
  };

  const findApartment = (id: number): apartmentsItem | undefined =>
    allApartments.value.find((apartment) => apartment.id === id);

  const setSortBy = (newSortBy: SortOption): void => {
    sortBy.value = newSortBy;
    commitNow();
  };

  const toggleRoom = (value: number): void => {
    filters.value.rooms = filters.value.rooms.includes(value) ? [] : [value];
    commitNow();
  };

  // Slider input: reflect the new range at once so the labels track the handle,
  // then commit it on the debounce.
  const setPriceRange = (range: [number, number]): void => {
    filters.value.priceRange = [range[0], range[1]];
    commitFilters();
  };

  const setSquareRange = (range: [number, number]): void => {
    filters.value.squareRange = [range[0], range[1]];
    commitFilters();
  };

  const resetFilters = (): void => {
    filters.value = createDefaultFilters();
    sortBy.value = "default";
    commitNow();
  };

  return {
    allApartments,
    displayedApartments,
    filteredApartments,
    currentPage,
    itemsPerPage,
    isLoading,
    error,
    rooms,
    sortBy,
    filters,
    hasInitialized,
    hasMoreItems,
    totalFloors,
    isEmpty,
    hasNoData,
    fetchApartments,
    retryFetch,
    loadMore,
    findApartment,
    setSortBy,
    toggleRoom,
    setPriceRange,
    setSquareRange,
    resetFilters,
  };
});
