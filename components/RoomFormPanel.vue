<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    busy?: boolean;
    buttonLabel: string;
    buttonColor?: "primary" | "secondary" | "neutral";
    errorMessage?: string;
    heading: string;
    passwordLabel?: string;
    playerPlaceholder: string;
    roomPlaceholder: string;
    description: string;
    submitIcon?: string;
    submitMode: "create" | "join";
  }>(),
  {
    busy: false,
    buttonColor: "primary",
    errorMessage: "",
    passwordLabel: "Password",
    submitIcon: undefined,
  },
);

const emit = defineEmits<{
  submit: [payload: { player: string; pw?: string; room: string }];
}>();

const formState = reactive({
  player: "",
  pw: "",
  room: "",
});

watch(
  () => props.submitMode,
  () => {
    formState.player = "";
    formState.pw = "";
    formState.room = "";
  },
);

const canSubmit = computed(() => {
  return formState.player.trim().length > 0 && formState.room.trim().length > 0;
});

function submit() {
  emit("submit", {
    player: formState.player.trim(),
    pw: formState.pw.trim() || undefined,
    room: formState.room.trim(),
  });
}

defineExpose({
  setRoom(room: string) {
    formState.room = room;
  },
});
</script>

<template>
  <UCard class="stu-panel rounded-[2rem] border-0">
    <template #header>
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-semibold uppercase tracking-[0.2em]">{{ heading }}</h2>
          <p class="mt-2 text-sm text-[rgba(33,22,15,0.65)]">
            {{ description }}
          </p>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          label="Back to lobby"
          to="/"
        />
      </div>
    </template>

    <div class="grid gap-4">
      <UFormField label="Player name">
        <UInput
          v-model="formState.player"
          autocomplete="off"
          :placeholder="playerPlaceholder"
          size="xl"
        />
      </UFormField>
      <UFormField label="Room Name">
        <UInput
          v-model="formState.room"
          autocomplete="off"
          :placeholder="roomPlaceholder"
          size="xl"
        />
      </UFormField>
      <UFormField :label="passwordLabel">
        <UInput
          v-model="formState.pw"
          autocomplete="off"
          placeholder="Leave blank for no password"
          size="xl"
        />
      </UFormField>
      <UButton
        :disabled="!canSubmit"
        block
        :color="buttonColor"
        :icon="submitIcon"
        :loading="busy"
        :label="buttonLabel"
        size="xl"
        @click="submit"
      />
      <UAlert v-if="errorMessage" color="error" variant="soft" :title="errorMessage" />
    </div>
  </UCard>
</template>
