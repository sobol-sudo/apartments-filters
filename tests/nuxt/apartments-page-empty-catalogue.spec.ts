// @vitest-environment nuxt
import { describe, expect, it } from "vitest";
import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import IndexPage from "~/pages/index.vue";

// Nothing listed at all. Kept in its own file so the page is mounted against a
// genuinely empty endpoint rather than a filtered view of a full one.
registerEndpoint("/api/apartments", () => []);

describe("apartments page with an empty catalogue", () => {
  it("says the catalogue is empty instead of rendering a blank page", async () => {
    const page = await mountSuspended(IndexPage);

    expect(page.findAll(".apartments-item")).toHaveLength(0);
    expect(page.text()).toContain("No apartments listed");

    // Exactly one empty state: an empty catalogue is not also "no apartments
    // match the selected filters".
    expect(page.findAll(".empty-state")).toHaveLength(1);
    expect(page.text()).not.toContain("No apartments found");
  });
});
