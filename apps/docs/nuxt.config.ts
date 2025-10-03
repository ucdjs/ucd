// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/content",
    "@nuxt/ui",
    "@nuxt/test-utils",
  ],
  compatibilityDate: "2025-07-18",
  nitro: {
    preset: "cloudflare_module",
    cloudflare: {
      deployConfig: false,
    },
  },
  eslint: {
    config: {
      stylistic: {
        quotes: "double",
        semi: true,
      },
      devtools: {
        enabled: true,
      },
    },
  },
  llms: {
    domain: "https://docs.ucdjs.dev",
    title: "UCD.js",
    description: "Write beautiful docs with Markdown.",
    full: {
      title: "UCD.js",
      description: "Write beautiful docs with Markdown.",
    },
  },
});
