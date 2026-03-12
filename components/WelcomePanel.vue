<template>
  <UCard class="stu-panel rounded-[2rem] border-0">
    <template #header>
      <div>
        <h2 class="text-2xl font-semibold uppercase tracking-[0.2em]">Lobby</h2>
        <p class="mt-2 text-sm text-[rgba(33,22,15,0.65)]">
          Create a private room or browse open rooms that are ready for players.
        </p>
      </div>
    </template>

    <div class="grid gap-4 md:grid-cols-2">
      <UButton
        block
        color="primary"
        label="Create Room"
        size="xl"
        class="min-h-28 rounded-3xl"
        to="/room/create"
      />
      <UButton
        block
        color="secondary"
        label="Join Room"
        size="xl"
        class="min-h-28 rounded-3xl"
        to="/room/join"
      />
    </div>
  </UCard>
</template>
