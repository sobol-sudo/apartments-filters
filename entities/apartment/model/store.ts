import type { apartmentsItem } from "../types";
import { getApartments } from "../api";

export type SortOption =
  | "price_asc"
  | "price_desc"
  | "square_asc"
  | "square_desc"
  | "floor_asc"
  | "floor_desc"
  | "default";

export interface FilterState {
  rooms: number[];
  priceRange: [number, number];
  squareRange: [number, number];
}

export interface RoomOption {
  name: string;
  value: number;
  active: boolean;
  disabled: boolean;
}

// Filter defaults
export const DEFAULT_PRICE_MIN = 5500000;
export const DEFAULT_PRICE_MAX = 18900000;
export const DEFAULT_SQUARE_MIN = 33;
export const DEFAULT_SQUARE_MAX = 123;
export const PRICE_STEP = 100000;
const ITEMS_PER_PAGE = 5;
const LOAD_MORE_DELAY = 1000;
const FILTERS_STORAGE_KEY = "apartments-filters";

// Pulls the bedroom count out of an apartment title, e.g. "2-bedroom, unit 102" -> 2
export const extractRoomsCount = (title: string): number => {
  const match = title.match(/(\d+)-bedroom/);
  return match ? parseInt(match[1], 10) : 0;
};

export const useApartmentsStore = defineStore("apartments", () => {
  const allApartments = ref<apartmentsItem[]>([]);
  const displayedApartments = ref<apartmentsItem[]>([]);
  const filteredApartments = ref<apartmentsItem[]>([]);
  const currentPage = ref(1);
  const itemsPerPage = ref(ITEMS_PER_PAGE);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const sortBy = ref<SortOption>("default");
  const hasInitialized = ref(false);

  const rooms = reactive<RoomOption[]>([
    {
      name: "1BR",
      value: 1,
      active: false,
      disabled: false,
    },
    {
      name: "2BR",
      value: 2,
      active: true,
      disabled: false,
    },
    {
      name: "3BR",
      value: 3,
      active: false,
      disabled: false,
    },
    {
      name: "4BR",
      value: 4,
      active: false,
      disabled: true,
    },
  ]);

  const filters = ref<FilterState>({
    rooms: [],
    priceRange: [DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX],
    squareRange: [DEFAULT_SQUARE_MIN, DEFAULT_SQUARE_MAX],
  });

  const initPersistedState = (): void => {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        filters.value = parsed.filters ?? filters.value;
        sortBy.value = parsed.sortBy ?? "default";

        rooms.forEach((room) => {
          room.active = filters.value.rooms.includes(room.value);
        });
      } catch (e) {
        console.warn("Failed to restore saved filters:", e);
      }
    }
  };

  const hasMoreItems = computed(() => {
    return displayedApartments.value.length < filteredApartments.value.length;
  });

  const totalPages = computed(() => {
    return Math.ceil(filteredApartments.value.length / itemsPerPage.value);
  });

  const isEmpty = computed(() => {
    return (
      hasInitialized.value &&
      !isLoading.value &&
      allApartments.value.length > 0 &&
      filteredApartments.value.length === 0
    );
  });

  const hasNoData = computed(() => {
    return !isLoading.value && allApartments.value.length === 0;
  });

  // Persist the current filters and sort order so they survive a page reload
  const saveFilters = () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({ filters: filters.value, sortBy: sortBy.value })
    );
  };

  const sortMapper: Record<
    SortOption,
    (a: apartmentsItem, b: apartmentsItem) => number
  > = {
    default: () => 0,
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    square_asc: (a, b) => a.square - b.square,
    square_desc: (a, b) => b.square - a.square,
    floor_asc: (a, b) => a.floor - b.floor,
    floor_desc: (a, b) => b.floor - a.floor,
  };

  const filterApartments = (apartments: apartmentsItem[]): apartmentsItem[] => {
    return apartments.filter((apartment) => {
      // Bedrooms
      if (filters.value.rooms.length > 0) {
        const roomsCount = extractRoomsCount(apartment.title);
        if (!filters.value.rooms.includes(roomsCount)) {
          return false;
        }
      }

      // Price
      const [priceMin, priceMax] = filters.value.priceRange;
      if (apartment.price < priceMin || apartment.price > priceMax) {
        return false;
      }

      // Area
      const [squareMin, squareMax] = filters.value.squareRange;
      if (apartment.square < squareMin || apartment.square > squareMax) {
        return false;
      }

      return true;
    });
  };

  const sortApartments = (
    apartments: apartmentsItem[],
    sortOption: SortOption
  ): apartmentsItem[] => {
    if (sortOption === "default") return [...apartments];

    const sortFn = sortMapper[sortOption];
    return [...apartments].sort(sortFn);
  };

  const applyFiltersAndSort = () => {
    if (allApartments.value.length === 0) return;

    const filtered = filterApartments(allApartments.value);
    const sorted = sortApartments(filtered, sortBy.value);

    filteredApartments.value = sorted;
    currentPage.value = 1;
    displayedApartments.value = filteredApartments.value.slice(
      0,
      itemsPerPage.value
    );
  };

  const fetchApartments = async () => {
    if (allApartments.value.length > 0) return;

    isLoading.value = true;
    error.value = null;

    try {
      const data = await getApartments();
      allApartments.value = data;
      hasInitialized.value = true;
      initPersistedState();
      applyFiltersAndSort();
    } catch (err) {
      error.value = err as Error;
      console.error("Error fetching apartments:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const loadMore = async (): Promise<void> => {
    if (!hasMoreItems.value || isLoading.value) return;

    isLoading.value = true;

    try {
      await new Promise((resolve) => setTimeout(resolve, LOAD_MORE_DELAY));

      currentPage.value++;
      const startIndex = 0;
      const endIndex = currentPage.value * itemsPerPage.value;

      displayedApartments.value = filteredApartments.value.slice(
        startIndex,
        endIndex
      );
    } catch (err) {
      console.error("Failed to load more apartments:", err);
      error.value = err as Error;
    } finally {
      isLoading.value = false;
    }
  };

  const setSortBy = (newSortBy: SortOption) => {
    sortBy.value = newSortBy;
    applyFiltersAndSort();
    saveFilters();
  };

  const setRoomsFilter = (rooms: number[]) => {
    filters.value.rooms = rooms;
    applyFiltersAndSort();
    saveFilters();
  };

  const resetRooms = () => {
    rooms.forEach((room) => (room.active = false));
  };

  const setPriceRange = (range: [number, number]) => {
    filters.value.priceRange = range;
    applyFiltersAndSort();
    saveFilters();
  };

  const setSquareRange = (range: [number, number]) => {
    filters.value.squareRange = range;
    applyFiltersAndSort();
    saveFilters();
  };

  const resetFilters = () => {
    filters.value = {
      rooms: [],
      priceRange: [DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX],
      squareRange: [DEFAULT_SQUARE_MIN, DEFAULT_SQUARE_MAX],
    };
    sortBy.value = "default";
    applyFiltersAndSort();
    saveFilters();
  };

  const reset = () => {
    allApartments.value = [];
    displayedApartments.value = [];
    filteredApartments.value = [];
    currentPage.value = 1;
    isLoading.value = false;
    error.value = null;
    sortBy.value = "default";
    hasInitialized.value = false;
    filters.value = {
      rooms: [],
      priceRange: [DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX],
      squareRange: [DEFAULT_SQUARE_MIN, DEFAULT_SQUARE_MAX],
    };
    saveFilters();
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
    totalPages,
    isEmpty,
    hasNoData,
    fetchApartments,
    resetRooms,
    loadMore,
    setSortBy,
    setRoomsFilter,
    setPriceRange,
    setSquareRange,
    resetFilters,
    reset,
  };
});
