import type { WaitingRoomAccessState } from "~/utils/types";

export default defineNuxtRouteMiddleware(async (to) => {
  const room = typeof to.query.room === "string" ? to.query.room.trim() : "";
  const key = typeof to.query.key === "string" ? to.query.key.trim() : "";
  const idValue = typeof to.query.id === "string" ? Number(to.query.id) : Number.NaN;

  if (!room || !Number.isFinite(idValue) || idValue <= 0) {
    return navigateTo("/");
  }

  try {
    const access = await $fetch<WaitingRoomAccessState>("/database/wait/access/", {
      params: { room },
    });

    if (!access.exists) {
      console.error("[waiting-room-query] Requested room does not exist.", { room });
      return navigateTo("/");
    }

    if (access.hasPassword && !key) {
      console.error("[waiting-room-query] Missing key for protected waiting room.", {
        room,
      });
      return navigateTo("/");
    }
  } catch (error) {
    console.error("[waiting-room-query] Failed to validate waiting room access.", error);
    return navigateTo("/");
  }
});
