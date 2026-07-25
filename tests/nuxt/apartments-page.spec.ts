// @vitest-environment nuxt
import { beforeEach, describe, expect, it } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { apartmentsItems } from "~/entities/apartment/mock";
import { useApartmentsStore } from "~/entities/apartment/model/store";
import { DEFAULT_SQUARE_MAX } from "~/entities/apartment/model/filters";
import IndexPage from "~/pages/index.vue";

registerEndpoint("/api/apartments", () => apartmentsItems);

// The commit delay the store uses for slider input.
const COMMIT_DELAY = 300;
const waitForCommit = () =>
  new Promise((resolve) => setTimeout(resolve, COMMIT_DELAY + 50));

describe("apartments page", () => {
  // The Nuxt app, and with it the pinia instance, is shared by the tests in
  // this file. Start each one from the same place instead of from whatever the
  // previous test left behind.
  beforeEach(() => {
    document.cookie = "apartments-filters=; path=/; max-age=0";
    useApartmentsStore().resetFilters();
  });

  it("recovers from the empty state through its own reset button", async () => {
    const page = await mountSuspended(IndexPage);
    const store = useApartmentsStore();

    expect(page.findAll(".apartments-item")).toHaveLength(5);

    // Drag the area slider somewhere nothing matches.
    store.setSquareRange([120, DEFAULT_SQUARE_MAX]);
    await waitForCommit();
    await nextTick();

    expect(page.findAll(".apartments-item")).toHaveLength(0);
    expect(page.text()).toContain("No apartments found");

    // The empty state carries its own reset button, separate from the one in
    // the sidebar. It has to clear the filters immediately, and it has to
    // cancel whatever the sliders still have queued.
    const emptyStateReset = page.find(".empty-state button");
    expect(emptyStateReset.text()).toContain("Reset filters");

    await emptyStateReset.trigger("click");
    await nextTick();

    expect(page.findAll(".apartments-item")).toHaveLength(5);
    expect(page.text()).not.toContain("No apartments found");

    // And it stays recovered once the debounce window has passed.
    await waitForCommit();
    await nextTick();

    expect(page.findAll(".apartments-item")).toHaveLength(5);
  });

  it("pages through the catalogue and stops offering more at the end", async () => {
    const page = await mountSuspended(IndexPage);

    const loadMore = () =>
      page
        .findAll("button")
        .find((button) => button.text().includes("Load more"));

    expect(page.findAll(".apartments-item")).toHaveLength(5);

    await loadMore()?.trigger("click");
    await nextTick();
    expect(page.findAll(".apartments-item")).toHaveLength(10);

    await loadMore()?.trigger("click");
    await nextTick();
    expect(page.findAll(".apartments-item")).toHaveLength(15);
    expect(loadMore()).toBeUndefined();
  });
});
