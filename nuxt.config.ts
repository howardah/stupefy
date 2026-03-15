export default defineNuxtConfig({
  compatibilityDate: "2026-03-12",
  css: ["~/assets/css/main.css"],
  devtools: { enabled: true },
  modules: ["@nuxt/ui"],
  nitro: {
    experimental: {
      websocket: true,
    },
  },
  srcDir: ".",
});
