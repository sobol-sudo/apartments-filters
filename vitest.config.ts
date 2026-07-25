import { defineVitestConfig } from "@nuxt/test-utils/config";

// Two kinds of test live side by side:
//
// tests/unit  - plain functions, no Nuxt runtime, node environment (fast).
// tests/nuxt  - the store, the composables and the pages, which need auto
//               imports, useCookie and a DOM. Those files opt in with a
//               `// @vitest-environment nuxt` docblock.
export default defineVitestConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.spec.ts"],
    environmentOptions: {
      nuxt: {
        domEnvironment: "happy-dom",
      },
    },
  },
});
