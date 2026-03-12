<script setup lang="ts">
import type { CharacterCard, PlayerState } from "~/utils/types";

defineProps<{
  player: PlayerState;
}>();

const emit = defineEmits<{
  choose: [character: CharacterCard];
}>();

function roleSentence(role: PlayerState["role"]) {
  switch (role) {
    case "minister":
      return "Lead the Ministry team and stay alive while your side defeats the Death Eaters.";
    case "auror":
      return "Protect the Minister and help your side defeat the Death Eaters.";
    case "death eater":
      return "Work with your allies to bring down the Ministry and take control of the table.";
    case "werewolf":
      return "You are on your own. Survive the chaos and outlast everyone else.";
    default:
      return "Choose the character that best fits your opening plan.";
  }
}
</script>

<template>
  <div class="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(18,10,5,0.62)] p-4">
    <UCard class="stu-panel w-full max-w-5xl rounded-[2rem] border-0">
      <template #header>
        <div class="space-y-2">
          <div class="text-xs uppercase tracking-[0.22em] text-[rgba(33,22,15,0.55)]">Choose Character</div>
          <h2 class="text-2xl font-semibold">{{ player.name }}, choose your character</h2>
          <p class="max-w-3xl text-sm text-[rgba(33,22,15,0.7)]">
            {{ roleSentence(player.role) }}
          </p>
        </div>
      </template>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GameplayCharacterCard
          v-for="character in Array.isArray(player.character) ? player.character : []"
          :key="character.fileName"
          :character="character"
          @click="emit('choose', character)"
        />
      </div>
    </UCard>
  </div>
</template>
