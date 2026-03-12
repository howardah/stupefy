export default defineNuxtRouteMiddleware((to) => {
  const room = typeof to.query.room === "string" ? to.query.room.trim() : "";
  const key = typeof to.query.key === "string" ? to.query.key.trim() : "";
  const idValue = typeof to.query.id === "string" ? Number(to.query.id) : Number.NaN;

  if (!room || !key || !Number.isFinite(idValue) || idValue <= 0) {
    return navigateTo("/welcome");
  }
});
