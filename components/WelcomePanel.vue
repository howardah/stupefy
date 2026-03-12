<script setup lang="ts">
defineProps<{
  busy?: boolean;
  errorMessage?: string;
}>();

const emit = defineEmits<{
  create: [payload: { player: string; pw?: string; room: string }];
  join: [payload: { player: string; pw?: string; room: string }];
}>();

const mode = ref<"intro" | "create" | "join">("intro");
const createState = reactive({
  player: "",
  pw: "",
  room: "",
});
const joinState = reactive({
  player: "",
  pw: "",
  room: "",
});

const canCreate = computed(() => createState.player && createState.room);
const canJoin = computed(() => joinState.player && joinState.room);

function emitCreate() {
  emit("create", {
    player: createState.player.trim(),
    pw: createState.pw.trim() || undefined,
    room: createState.room.trim(),
  });
}

function emitJoin() {
  emit("join", {
    player: joinState.player.trim(),
    pw: joinState.pw.trim() || undefined,
    room: joinState.room.trim(),
  });
}
</script>

<template>
  <UCard class="stu-panel rounded-[2rem] border-0">
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-semibold uppercase tracking-[0.2em]">Lobby</h2>
          <p class="mt-2 text-sm text-[rgba(33,22,15,0.65)]">
            Start a room or join one that already exists.
          </p>
        </div>
        <UButton
          v-if="mode !== 'intro'"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          label="Back"
          @click="mode = 'intro'"
        />
      </div>
    </template>

    <div v-if="mode === 'intro'" class="grid gap-4 md:grid-cols-2">
      <UButton
        block
        color="primary"
        label="Create Room"
        size="xl"
        class="min-h-28 rounded-3xl"
        :disabled="busy"
        @click="mode = 'create'"
      />
      <UButton
        block
        color="secondary"
        label="Join Room"
        size="xl"
        class="min-h-28 rounded-3xl"
        :disabled="busy"
        @click="mode = 'join'"
      />
    </div>

    <div v-else-if="mode === 'create'" class="grid gap-4">
      <UFormField label="Your Name">
        <UInput v-model="createState.player" autocomplete="off" placeholder="Moony" size="xl" />
      </UFormField>
      <UFormField label="Room Name">
        <UInput v-model="createState.room" autocomplete="off" placeholder="Order of the Phoenix" size="xl" />
      </UFormField>
      <UFormField label="Password">
        <UInput
          v-model="createState.pw"
          autocomplete="off"
          placeholder="Optional"
          size="xl"
        />
      </UFormField>
      <UButton
        :disabled="!canCreate"
        block
        color="primary"
        :loading="busy"
        label="Create"
        size="xl"
        @click="emitCreate"
      />
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        :title="errorMessage"
      />
    </div>

    <div v-else class="grid gap-4">
      <UFormField label="Your Name">
        <UInput v-model="joinState.player" autocomplete="off" placeholder="Luna" size="xl" />
      </UFormField>
      <UFormField label="Room Name">
        <UInput v-model="joinState.room" autocomplete="off" placeholder="Room Name" size="xl" />
      </UFormField>
      <UFormField label="Password">
        <UInput
          v-model="joinState.pw"
          autocomplete="off"
          placeholder="Optional"
          size="xl"
        />
      </UFormField>
      <UButton
        :disabled="!canJoin"
        block
        color="secondary"
        :loading="busy"
        label="Join"
        size="xl"
        @click="emitJoin"
      />
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        :title="errorMessage"
      />
    </div>
  </UCard>
</template>
