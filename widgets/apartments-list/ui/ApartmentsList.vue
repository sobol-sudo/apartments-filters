<script setup lang="ts">
import { type apartmentsItem } from "~/entities/apartment/types";
import { getImage } from "~/shareds/lib/get-image";

withDefaults(
  defineProps<{
    items: apartmentsItem[];
    // Taken from the catalogue rather than hard-coded, so the "of N" never
    // claims floors the data does not contain. 0 hides it entirely.
    totalFloors?: number;
  }>(),
  { totalFloors: 0 }
);

const formatNumber = (value: number): string => value.toLocaleString("en-US");
</script>

<template>
  <div class="apartments-list">
    <NuxtLink
      v-for="item in items"
      :key="item.id"
      :to="`/apartments/${item.id}`"
      class="apartments-item"
    >
      <div class="apartments-item__image">
        <img :src="getImage(item.image)" :alt="item.title" />
      </div>

      <div class="apartments-item__content">
        <h3 class="apartments-item__title">{{ item.title }}</h3>

        <p class="apartments-item__square">
          {{ formatNumber(item.square) }}

          <span>m²</span>
        </p>

        <p class="apartments-item__floor">
          {{ item.floor }}

          <span>
            <template v-if="totalFloors">of {{ totalFloors }}</template>

            <sub>{{ totalFloors ? 'floors' : 'floor' }}</sub>
          </span>
        </p>

        <p class="apartments-item__price">
          {{ formatNumber(item.price) }}

          <span>₽</span>
        </p>
      </div>
    </NuxtLink>
  </div>
</template>

<style lang="scss">
.apartments-list {
  display: flex;
  flex-direction: column;
  width: 100%;

  @media screen and ($media-tablet) {
    gap: 4px;
  }
}

.apartments-item {
  display: flex;
  box-shadow: 0px 1px 0px 0px rgba(0, 0, 0, 0.1);
  width: 100%;
  padding: 16px 0 24px;
  gap: 20px;
  max-height: 120px;
  cursor: pointer;
  transition: $transition-base;
  color: inherit;
  text-decoration: none;

  &:hover {
    box-shadow: 0px 1px 0px 0px rgba(0, 0, 0, 0.6);
  }

  @media screen and ($media-tablet) {
    box-shadow: none;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    flex-direction: row-reverse;
    padding: 16px 24px;
    max-height: 112px;
  }

  &__image {
    width: 80px;
    min-width: 80px;
    height: 80px;
    user-select: none;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__content {
    display: flex;
    gap: 20px;
    font: $text-p;
    width: 100%;

    @media screen and ($media-tablet) {
      gap: 0 20px;
      flex-wrap: wrap;
      font-size: 14px;
    }
  }

  &__title {
    max-width: 281px;
    width: 100%;
    font: $text-p2-medium;

    @media screen and ($media-tablet) {
      max-width: 100%;
      font-size: 14px;
      line-height: 14px;
    }
  }

  &__square {
    width: 120px;
    display: flex;

    span {
      display: none;

      @media screen and ($media-tablet) {
        display: block;
      }
    }

    @media screen and ($media-tablet) {
      width: 43px;
    }
  }

  &__floor {
    width: 120px;
    display: flex;
    gap: 4px;

    span {
      color: $color-main-font-medium;
      display: flex;
      gap: 8px;

      sub {
        display: none;

        @media screen and ($media-tablet) {
          display: block;
        }
      }
    }

    @media screen and ($media-tablet) {
      width: auto;
    }
  }

  &__price {
    width: 120px;
    display: flex;
    margin-left: auto;
    gap: 4px;

    span {
      display: none;

      @media screen and ($media-tablet) {
        display: block;
      }
    }

    @media screen and ($media-tablet) {
      width: auto;
      margin-left: initial;
    }
  }
}
</style>
