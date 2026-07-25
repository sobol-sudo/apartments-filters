<script setup lang="ts">
import Button from "~/shareds/ui/button/Button.vue";
import Loading from "~/shareds/ui/loading/Loading.vue";
import IconError from "~/shareds/icons/IconError.vue";
import EmptyState from "~/shareds/ui/empty-state/EmptyState.vue";
import ApartmentFilter from "~/features/apartment-filters/ui/ApartmentFilter.vue";
import { useApartmentsStore } from "~/entities/apartment/model/store";
import ApartmentsList from "~/widgets/apartments-list/ui/ApartmentsList.vue";
import ApartmentsTopFilter from "~/widgets/apartments-top-filter/ui/ApartmentsTopFilter.vue";

const apartmentsStore = useApartmentsStore();

const resetFilters = (): void => {
  apartmentsStore.resetFilters();
  apartmentsStore.resetRooms();
};

const shouldShowList = computed(
  () =>
    !apartmentsStore.isEmpty &&
    !apartmentsStore.hasNoData &&
    !apartmentsStore.error
);

const shouldShowLoadMore = computed(
  () =>
    apartmentsStore.hasMoreItems && !apartmentsStore.isLoading
);

// Runs on the server during SSR and is skipped on hydration, so the first
// paint already contains the list instead of an empty column
await callOnce("apartments", () => apartmentsStore.fetchApartments());

// localStorage only exists on the client, so saved filters are applied
// right after hydration
onMounted(() => {
  apartmentsStore.restorePersistedFilters();
});
</script>

<template>
  <div class="home">
    <div class="home__container">
      <div class="home__content">
        <h1>Apartments</h1>

        <ApartmentsTopFilter />

        <ApartmentsList
          v-if="shouldShowList"
          :items="apartmentsStore.displayedApartments"
        />

        <div v-if="apartmentsStore.isLoading" class="home__loading">
          <Loading />
        </div>

        <div v-if="apartmentsStore.error" class="home__error">
          <div class="home__error-message">
            <IconError />
            <p>Something went wrong while loading apartments</p>
          </div>

          <Button
            :loading="apartmentsStore.isLoading"
            @click="apartmentsStore.retryFetch"
          >
            Try again
          </Button>
        </div>

        <EmptyState
          v-if="apartmentsStore.isEmpty"
          title="No apartments found"
          description="No apartments match the selected filters. Try adjusting your search."
        >
          <template #action>
            <Button @click="resetFilters"> Reset filters </Button>
          </template>
        </EmptyState>

        <Button
          v-if="shouldShowLoadMore"
          class="home__button"
          :loading="apartmentsStore.isLoading"
          @click="apartmentsStore.loadMore"
        >
          Load more
        </Button>
      </div>

      <ApartmentFilter />
    </div>
  </div>
</template>

<style lang="scss">
.home {
  &__container {
    display: flex;
    max-width: $wrapper;
    padding: 96px 80px;
    margin: 0 auto;
    justify-content: space-between;
    gap: 28px;

    @media screen and ($media-tablet) {
      padding: 48px 54px;
    }
  }

  &__content {
    max-width: 801px;
    width: 100%;

    h1 {
      margin-bottom: 48px;

      @media screen and ($media-tablet) {
        margin-bottom: 32px;
      }
    }
  }

  &__button {
    margin-top: 48px;
  }

  &__loading {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 0;
  }

  &__error {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 48px 0;
  }

  &__error-message {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

h1 {
  font: $text-h1;
}
</style>
