export default defineNuxtConfig({
  compatibilityDate: "2026-03-12",
  css: ["~/assets/css/main.css"],
  devtools: { enabled: true },
  modules: ["@nuxt/ui"],

  alias: {
    "@": new URL("./", import.meta.url).pathname,
    "@app": new URL("./app", import.meta.url).pathname,
    "@shared": new URL("./shared", import.meta.url).pathname,
    "@server": new URL("./server", import.meta.url).pathname,
    "@main.css": new URL("./app/assets/css/main.css", import.meta.url).pathname,
  },

  nitro: {
    experimental: {
      websocket: true,
    },
  },
});
