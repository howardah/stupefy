export default defineNuxtPlugin(async () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    await Promise.all(
      registrations.map(async (registration) => {
        const scriptUrl =
          registration.active?.scriptURL ||
          registration.waiting?.scriptURL ||
          registration.installing?.scriptURL ||
          "";

        if (
          scriptUrl.includes("/service-worker.js") ||
          scriptUrl.includes("precache-manifest") ||
          registration.scope === window.location.origin + "/"
        ) {
          await registration.unregister();
        }
      }),
    );

    if ("caches" in window) {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.includes("workbox") || cacheName.includes("precache"))
          .map((cacheName) => caches.delete(cacheName)),
      );
    }
  } catch (error) {
    console.warn("[service-worker] Failed to clear legacy registrations.", error);
  }
});
