<script setup lang="ts">
const route = useRoute();
const api = useDatabaseApi();

const roomName = computed(() => String(route.query.room || ""));

const { data: roomState } = await useAsyncData("game-room-state", () =>
  api.getGameRoom({ room: roomName.value })
);
</script>

<template>
  <div class="stu-shell">
    <AppHeader />
    <UCard class="stu-panel rounded-[2rem] border-0">
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-semibold">Gameplay Migration</h2>
            <p class="text-sm text-[rgba(33,22,15,0.65)]">
              The full board logic is still being ported from the recovered React source.
            </p>
          </div>
          <UButton to="/welcome" color="neutral" variant="ghost" label="Back to lobby" />
        </div>
      </template>

      <div class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div class="rounded-3xl bg-white/60 p-5">
          <div class="mb-3 text-xs uppercase tracking-[0.2em] text-[rgba(33,22,15,0.55)]">
            Room Snapshot
          </div>
          <div class="text-lg font-semibold">{{ roomName }}</div>
          <div class="mt-4 space-y-2 text-sm">
            <div>Players: {{ roomState?.[0]?.players?.length || 0 }}</div>
            <div>Turn: {{ roomState?.[0]?.turn ?? "unknown" }}</div>
            <div>Phase: {{ roomState?.[0]?.turnCycle?.phase ?? "unknown" }}</div>
          </div>
        </div>

        <UTextarea
          :model-value="JSON.stringify(roomState?.[0] || {}, null, 2)"
          :rows="22"
          readonly
        />
      </div>
    </UCard>
  </div>
</template>
