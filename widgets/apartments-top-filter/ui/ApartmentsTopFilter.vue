<script setup lang="ts">
import IconArrowUp from "~/shareds/icons/IconArrowUp.vue";
import IconArrowDown from "~/shareds/icons/IconArrowDown.vue";
import { useApartmentsStore } from "~/entities/apartment/model/store";
import type { SortOption } from "~/entities/apartment/model/filters";

const apartmentsStore = useApartmentsStore();

type SortField = "rooms" | "square" | "floor" | "price";

const handleSort = (field: SortField): void => {
  const currentSort = apartmentsStore.sortBy;
  const ascSort = `${field}_asc` as SortOption;
  const descSort = `${field}_desc` as SortOption;

  let newSort: SortOption;

  // Sorting cycles through: asc -> desc -> default -> asc
  switch (currentSort) {
    case ascSort:
      newSort = descSort;
      break;
    case descSort:
      newSort = "default";
      break;
    default:
      newSort = ascSort;
  }

  apartmentsStore.setSortBy(newSort);
};

// Screen readers get the column's current sort state instead of a bare label
const sortState = (field: SortField): "ascending" | "descending" | "none" => {
  if (apartmentsStore.sortBy === `${field}_asc`) return "ascending";
  if (apartmentsStore.sortBy === `${field}_desc`) return "descending";
  return "none";
};
</script>

<template>
  <div class="apartments-top-filter">
    <span class="apartments-top-filter__layout">Floor plan</span>

    <button
      type="button"
      class="apartments-top-filter__room"
      :aria-label="`Sort by apartment, currently ${sortState('rooms')}`"
      @click="handleSort('rooms')"
    >
      Apartment

      <span class="apartments-top-filter__control">
        <IconArrowUp :class="{ active: apartmentsStore.sortBy === 'rooms_asc' }" />

        <IconArrowDown
          :class="{ active: apartmentsStore.sortBy === 'rooms_desc' }"
        />
      </span>
    </button>

    <button
      type="button"
      class="apartments-top-filter__square"
      :aria-label="`Sort by area, currently ${sortState('square')}`"
      @click="handleSort('square')"
    >
      S, m²

      <span class="apartments-top-filter__control">
        <IconArrowUp
          :class="{ active: apartmentsStore.sortBy === 'square_asc' }"
        />

        <IconArrowDown
          :class="{ active: apartmentsStore.sortBy === 'square_desc' }"
        />
      </span>
    </button>

    <button
      type="button"
      class="apartments-top-filter__floor"
      :aria-label="`Sort by floor, currently ${sortState('floor')}`"
      @click="handleSort('floor')"
    >
      Floor

      <span class="apartments-top-filter__control">
        <IconArrowUp :class="{ active: apartmentsStore.sortBy === 'floor_asc' }" />

        <IconArrowDown
          :class="{ active: apartmentsStore.sortBy === 'floor_desc' }"
        />
      </span>
    </button>

    <button
      type="button"
      class="apartments-top-filter__price"
      :aria-label="`Sort by price, currently ${sortState('price')}`"
      @click="handleSort('price')"
    >
      Price, ₽

      <span class="apartments-top-filter__control">
        <IconArrowUp :class="{ active: apartmentsStore.sortBy === 'price_asc' }" />

        <IconArrowDown
          :class="{ active: apartmentsStore.sortBy === 'price_desc' }"
        />
      </span>
    </button>
  </div>
</template>

<style lang="scss">
.apartments-top-filter {
  gap: 20px;
  display: flex;
  font: $text-p2-regular;
  padding-bottom: 17px;
  box-shadow: 0px 1px 0px 0px rgba(0, 0, 0, 0.1);
  user-select: none;

  @media screen and ($media-tablet) {
    box-shadow: none;
    padding-bottom: 12px;
  }

  button {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: inherit;
    text-align: left;
  }

  &__control {
    display: flex;
    flex-direction: column;
    gap: 2px;

    svg {
      opacity: 0.3;
      transition: $transition-base;
      color: $color-main-font;

      &.active {
        opacity: 1;
        color: $color-main-dark;
      }
    }
  }

  &__layout {
    width: 80px;
    min-width: 80px;

    @media screen and ($media-tablet) {
      display: none;
    }
  }

  &__room {
    max-width: 281px;
    width: 100%;
    display: flex;
    cursor: pointer;
    transition: $transition-base;
    gap: 8px;
    align-items: center;

    &:hover {
      opacity: 0.6;
    }

    @media screen and ($media-tablet) {
      display: none;
    }
  }

  &__square {
    width: 120px;
    display: flex;
    cursor: pointer;
    transition: $transition-base;
    gap: 8px;
    align-items: center;
    white-space: nowrap;

    &:hover {
      opacity: 0.6;
    }

    @media screen and ($media-tablet) {
      width: 44px;
    }
  }

  &__floor {
    width: 120px;
    cursor: pointer;
    transition: $transition-base;
    display: flex;
    gap: 8px;
    align-items: center;

    &:hover {
      opacity: 0.6;
    }

    @media screen and ($media-tablet) {
      width: 48px;
    }
  }

  &__price {
    width: 120px;
    margin-left: auto;
    cursor: pointer;
    transition: $transition-base;
    display: flex;
    gap: 8px;
    align-items: center;
    white-space: nowrap;
    color: $color-main-dark;

    &:hover {
      opacity: 0.6;
    }

    @media screen and ($media-tablet) {
      width: 64px;
      margin-left: initial;
    }
  }
}
</style>
