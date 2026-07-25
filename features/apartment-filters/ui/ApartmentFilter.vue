<script setup lang="ts">
import IconClose from "~/shareds/icons/IconClose.vue";
import VueSlider from "vue-3-slider-component";
import {
  useApartmentsStore,
  type RoomOption,
  DEFAULT_PRICE_MIN,
  DEFAULT_PRICE_MAX,
  DEFAULT_SQUARE_MIN,
  DEFAULT_SQUARE_MAX,
  PRICE_STEP,
} from "~/entities/apartment/model/store";
import { debounce } from "~/shareds/lib/debounce";

const apartmentsStore = useApartmentsStore();
const { filters, rooms } = storeToRefs(apartmentsStore);

const DEBOUNCE_DELAY = 300;

// Debounced store updates so dragging a slider does not refilter on every frame
const debouncedPriceUpdate = debounce((newRange: [number, number]) => {
  apartmentsStore.setPriceRange([newRange[0], newRange[1]]);
}, DEBOUNCE_DELAY);

const debouncedSquareUpdate = debounce((newRange: [number, number]) => {
  apartmentsStore.setSquareRange([newRange[0], newRange[1]]);
}, DEBOUNCE_DELAY);

// Slider handlers: update the local range immediately, sync the store on a debounce
const handlePriceChange =(newRange: [number, number]): void => {
  filters.value.priceRange = newRange;
  debouncedPriceUpdate(newRange);
};

const handleSquareChange = (newRange: [number, number]): void => {
  filters.value.squareRange = newRange;
  debouncedSquareUpdate(newRange);
};

const handleRoomClick = (room: RoomOption): void => {
  if (room.disabled) return;

  room.active = !room.active;

  rooms.value.forEach((roomOption) => {
    if (roomOption.value !== room.value) {
      roomOption.active = false;
    }
  });

  // Push the current selection to the store
  const activeRooms = rooms.value
    .filter((roomOption) => roomOption.active)
    .map((roomOption) => roomOption.value);
  apartmentsStore.setRoomsFilter(activeRooms);
};

const handleReset = (): void => {
  apartmentsStore.resetRooms();
  apartmentsStore.resetFilters();
};
</script>

<template>
  <div class="apartments-side-filter">
    <div class="apartments-side-filter__rooms">
      <div
        v-for="room in rooms"
        :key="room.value"
        class="apartments-side-filter__room"
        :class="{ active: room.active, disabled: room.disabled }"
        @click="handleRoomClick(room)"
      >
        <span>{{ room.name }}</span>
      </div>
    </div>

    <div class="apartments-side-filter__price">
      <p class="title">Price, ₽</p>

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
          @update:model-value="handlePriceChange"
          :min="DEFAULT_PRICE_MIN"
          :max="DEFAULT_PRICE_MAX"
          :step="PRICE_STEP"
        />
      </div>
    </div>

    <div class="apartments-side-filter__square">
      <p class="title">Area, m²</p>

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
          @update:model-value="handleSquareChange"
          :min="DEFAULT_SQUARE_MIN"
          :max="DEFAULT_SQUARE_MAX"
          :step="1"
        />
      </div>
    </div>

    <div class="apartments-side-filter__reset" @click="handleReset">
      Reset filters

      <IconClose />
    </div>
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

    &:hover {
      opacity: 0.6;
      cursor: pointer;
    }

    &.active {
      box-shadow: 0px 6px 20px 0px rgba(149, 208, 161, 1);
      background-color: $color-main-dark;
      color: rgba(255, 255, 255, 1);
    }

    &.disabled {
      color: $color-main-font-medium;
      cursor: not-allowed;

      &:hover {
        opacity: 1;
      }
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
