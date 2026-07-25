<script setup lang="ts">
import EmptyState from "~/shareds/ui/empty-state/EmptyState.vue";
import { getImage } from "~/shareds/lib/get-image";
import { getApartment } from "~/entities/apartment/api";
import { extractRoomsCount } from "~/entities/apartment/model/filters";

const route = useRoute();

// Fetched by id rather than read from the list store, so the page also works as
// a direct entry point: a shared link renders on the server, and an id that
// does not exist answers with a real 404.
const { data: apartment, error } = await useAsyncData(
  () => `apartment-${route.params.id}`,
  () => getApartment(route.params.id as string)
);

// The not-found state is rendered inside the page rather than handed to the
// global error page, so the status has to be set by hand: a listing that does
// not exist must answer 404, not 200 with an apology.
const requestEvent = useRequestEvent();

if (requestEvent && error.value) {
  setResponseStatus(requestEvent, error.value.statusCode === 404 ? 404 : 500);
}

const formatNumber = (value: number): string => value.toLocaleString("en-US");

const bedrooms = computed(() =>
  apartment.value ? extractRoomsCount(apartment.value.title) : 0
);

// Plain arithmetic on the two numbers the listing already carries
const pricePerSquare = computed(() =>
  apartment.value ? Math.round(apartment.value.price / apartment.value.square) : 0
);

useHead(() => ({
  title: apartment.value ? apartment.value.title : "Apartment not found",
}));
</script>

<template>
  <div class="apartment-page">
    <div class="apartment-page__container">
      <NuxtLink to="/" class="apartment-page__back">Back to apartments</NuxtLink>

      <EmptyState
        v-if="error || !apartment"
        title="Apartment not found"
        description="This listing is no longer available, or the link is incorrect."
      >
        <template #action>
          <NuxtLink to="/" class="apartment-page__cta">
            Browse all apartments
          </NuxtLink>
        </template>
      </EmptyState>

      <template v-else>
        <h1 class="apartment-page__title">{{ apartment.title }}</h1>

        <div class="apartment-page__body">
          <div class="apartment-page__image">
            <img :src="getImage(apartment.image)" :alt="apartment.title" />
          </div>

          <dl class="apartment-page__facts">
            <div v-if="bedrooms" class="apartment-page__fact">
              <dt>Bedrooms</dt>
              <dd>{{ bedrooms }}</dd>
            </div>

            <div class="apartment-page__fact">
              <dt>Area</dt>
              <dd>{{ formatNumber(apartment.square) }} m²</dd>
            </div>

            <div class="apartment-page__fact">
              <dt>Floor</dt>
              <dd>{{ apartment.floor }}</dd>
            </div>

            <div class="apartment-page__fact">
              <dt>Price</dt>
              <dd>{{ formatNumber(apartment.price) }} ₽</dd>
            </div>

            <div class="apartment-page__fact">
              <dt>Price per m²</dt>
              <dd>{{ formatNumber(pricePerSquare) }} ₽</dd>
            </div>
          </dl>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
.apartment-page {
  &__container {
    max-width: $wrapper;
    padding: 96px 80px;
    margin: 0 auto;

    @media screen and ($media-tablet) {
      padding: 48px 54px;
    }
  }

  &__back,
  &__cta {
    display: inline-flex;
    align-items: center;
    color: $color-main-dark;
    font: $text-p2-medium;
    text-decoration: none;
    transition: $transition-base;

    &:hover {
      opacity: 0.6;
    }
  }

  &__cta {
    border: 1px solid $color-addition-stroke;
    border-radius: 25px;
    height: 40px;
    padding: 0 24px;
    color: $color-main-font;
  }

  &__title {
    font: $text-h1;
    font-size: 40px;
    line-height: 44px;
    margin: 24px 0 48px;

    @media screen and ($media-tablet) {
      font-size: 28px;
      line-height: 32px;
      margin: 16px 0 32px;
    }
  }

  &__body {
    display: flex;
    gap: 48px;
    align-items: flex-start;

    @media screen and ($media-tablet) {
      flex-direction: column;
      gap: 24px;
    }
  }

  &__image {
    width: 320px;
    min-width: 320px;
    background: $color-main-gradient;
    border-radius: 10px;
    padding: 24px;

    @media screen and ($media-tablet) {
      width: 100%;
      min-width: 0;
    }

    img {
      width: 100%;
      height: auto;
      object-fit: contain;
    }
  }

  &__facts {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 420px;
  }

  &__fact {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    padding: 12px 0;
    box-shadow: 0px 1px 0px 0px rgba(0, 0, 0, 0.1);

    dt {
      color: $color-main-font-medium;
      font: $text-p2-regular;
    }

    dd {
      font: $text-p2-medium;
      margin: 0;
    }
  }
}
</style>
