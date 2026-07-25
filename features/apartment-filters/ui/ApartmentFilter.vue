<script setup lang="ts">
import IconClose from "~/shareds/icons/IconClose.vue";
import VueSlider from "vue-3-slider-component";
import { useApartmentsStore } from "~/entities/apartment/model/store";
import {
  DEFAULT_PRICE_MIN,
  DEFAULT_PRICE_MAX,
  DEFAULT_SQUARE_MIN,
  DEFAULT_SQUARE_MAX,
  PRICE_STEP,
  SQUARE_STEP,
} from "~/entities/apartment/model/filters";

const apartmentsStore = useApartmentsStore();
const { filters, rooms } = storeToRefs(apartmentsStore);

// Debouncing lives in the store, next to the state it commits, so that every
// reset entry point cancels a queued slider update and not just this one.
const handlePriceChange = (newRange: [number, number]): void => {
  apartmentsStore.setPriceRange(newRange);
};

const handleSquareChange = (newRange: [number, number]): void => {
  apartmentsStore.setSquareRange(newRange);
};
</script>

<template>
  <div class="apartments-side-filter">
    <div class="apartments-side-filter__rooms">
      <button
        v-for="room in rooms"
        :key="room.value"
        type="button"
        class="apartments-side-filter__room"
        :class="{ active: room.active }"
        :aria-pressed="room.active"
        @click="apartmentsStore.toggleRoom(room.value)"
      >
        <span>{{ room.name }}</span>
      </button>
    </div>

    <div class="apartments-side-filter__price">
      <p id="price-range-label" class="title">Price, ₽</p>

      <div class="description">
        <p>
          from <b>{{ filters.priceRange[0].toLocaleString("en-US") }}</b>
        </p>
        <p>
          to <b>{{ filters.priceRange[1].toLocaleString("en-US") }}</b>
        </p>
      </div>

      <div class="range">
        <VueSlider
          :model-value="filters.priceRange"
          :min="DEFAULT_PRICE_MIN"
          :max="DEFAULT_PRICE_MAX"
          :interval="PRICE_STEP"
          use-keyboard
          aria-labelledby="price-range-label"
          @update:model-value="handlePriceChange"
        />
      </div>
    </div>

    <div class="apartments-side-filter__square">
      <p id="square-range-label" class="title">Area, m²</p>

      <div class="description">
        <p>
          from <b>{{ filters.squareRange[0] }}</b>
        </p>
        <p>
          to <b>{{ filters.squareRange[1] }}</b>
        </p>
      </div>

      <div class="range">
        <VueSlider
          :model-value="filters.squareRange"
          :min="DEFAULT_SQUARE_MIN"
          :max="DEFAULT_SQUARE_MAX"
          :interval="SQUARE_STEP"
          use-keyboard
          aria-labelledby="square-range-label"
          @update:model-value="handleSquareChange"
        />
      </div>
    </div>

    <button
      type="button"
      class="apartments-side-filter__reset"
      @click="apartmentsStore.resetFilters"
    >
      Reset filters

      <IconClose />
    </button>
  </div>
</template>

<style lang="scss">
.apartments-side-filter {
  min-width: 399px;
  height: 372px;
  background: $color-main-gradient;
  border-radius: 10px;
  overflow: hidden;
  padding: 40px;

  @media screen and ($media-tablet) {
    min-width: 318px;
    height: 318px;
    padding: 20px 19px;
  }

  &__reset {
    margin-top: 24px;
    cursor: pointer;
    transition: $transition-base;
    padding: 0 16px;
    font-size: 13px;
    display: flex;
    gap: 8px;
    align-items: center;
    font: $text-p2-regular;
    user-select: none;
    background: none;
    border: none;
    color: inherit;

    @media screen and ($media-tablet) {
      font-size: 13px;
    }

    &:hover {
      opacity: 0.6;
    }
  }

  &__rooms {
    display: flex;
    gap: 16px;
  }

  &__room {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 1);
    display: flex;
    justify-content: center;
    align-items: center;
    transition: $transition-base;
    user-select: none;
    border: none;
    font: inherit;
    color: inherit;

    &:hover {
      opacity: 0.6;
      cursor: pointer;
    }

    &.active {
      box-shadow: 0px 6px 20px 0px rgba(149, 208, 161, 1);
      background-color: $color-main-dark;
      color: rgba(255, 255, 255, 1);
    }
  }

  &__square,
  &__price {
    margin-top: 24px;

    .title {
      font: $text-p3-regular;

      @media screen and ($media-tablet) {
        font-size: 13px;
        line-height: 18px;
      }
    }

    .description {
      display: flex;
      font: $text-p2-regular;
      margin-top: 8px;

      @media screen and ($media-tablet) {
        font-size: 12px;
        margin-top: 4px;
      }

      p {
        color: $color-main-font-medium;
        width: 50%;

        b {
          color: $color-main-font;
          font: $text-p2-medium;
          margin-left: 8px;

          @media screen and ($media-tablet) {
            font-size: 14px;
          }
        }
      }
    }

    .range {
      margin-top: 4px;
    }
  }

  .vue-slider {
    &-process {
      background-color: $color-main-dark;
    }

    &-dot-handle {
      background-color: $color-main-dark;
      box-shadow: none;
    }

    &-dot-tooltip-inner {
      display: none;
    }
  }
}
</style>
