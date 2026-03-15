import type {
  GameEventBystanderKey,
  GameEvent,
  GameplayTarget,
  PlayerState,
  PopupOption,
  PopupState,
} from "../types";
import { cardsIncludeName, getPrimaryCharacter, titleCase } from "./core";
import { canUseHideCards, ignoresOpposingTableau } from "./powers";

export function eventIndex(events: GameEvent[], message: string): number {
  return events.findIndex((event) => event.popup?.message?.includes(message));
}

export function getPopupState(events: GameEvent[] | undefined, playerId: number): PopupState {
  if (events?.[0]) {
    const firstEvent = events[0];

    if (firstEvent.target.includes(playerId) && firstEvent.popup) {
      return {
        ...firstEvent.popup,
        canDismiss: true,
      };
    }

    const bystanderKey: GameEventBystanderKey = `bystanders-${playerId}`;
    const bystanderPopup = firstEvent[bystanderKey];
    if (bystanderPopup && typeof bystanderPopup === "object") {
      return {
        ...bystanderPopup,
        canDismiss: false,
      };
    }

    if (firstEvent.bystanders) {
      return {
        ...firstEvent.bystanders,
        canDismiss: false,
      };
    }
  }

  return { canDismiss: true, message: "", options: [] };
}

export function createResolutionEvent(
  message: string,
  targets: Array<number | string>,
  bystanders?: string,
): GameEvent {
  const event: GameEvent = {
    popup: {
      message,
      options: [],
      popupType: "resolution",
    },
    cardType: "resolution",
    target: targets,
  };

  if (bystanders) {
    event.bystanders = {
      message: bystanders,
      options: [],
      popupType: "resolution",
    };
  }

  return event;
}

export function resolveSystemEvent(
  key: string,
  turnOrder: number[],
  resolutionText = "",
): GameEvent | false {
  const targets = [...turnOrder];

  switch (key) {
    case "stupefy":
      return createResolutionEvent(resolutionText, targets);
    case "diagon_alley":
      return createResolutionEvent("Everyone‘s taken their card.", targets);
    case "garroting_gas":
      return createResolutionEvent("The Garroting Gas has cleared!", targets);
    case "dementors":
      return createResolutionEvent("The Dementors are gone!", targets);
    default:
      return false;
  }
}

export function deathCheck(players: PlayerState[], deadPlayers: number[]): number[] {
  return players
    .filter((player) => {
      const character = getPrimaryCharacter(player);
      return Boolean(character && character.health === 0 && !deadPlayers.includes(player.id));
    })
    .map((player) => player.id);
}

export function tableauProblems(cards: PlayerState["tableau"]): string | false {
  const wands = ["larch_wand", "yew_wand", "aspen_wand", "holly_wand", "elder_wand"];
  const cardNames: string[] = [];
  let wandCount = 0;

  for (const card of cards) {
    if (wands.includes(card.name)) {
      wandCount += 1;
    }

    if (wandCount > 1) {
      return "You can only have one wand! Discard your current wand first.";
    }

    if (cardNames.includes(card.name)) {
      if (card.name === "azkaban") return "They are already in Azkaban!";

      return `You can only have one ${titleCase(card.name.replace("_", " "))} Discard your current one first.`;
    }

    cardNames.push(card.name);
  }

  return false;
}

export function protegoOptions(
  player: PlayerState,
  currentOptions: PopupOption[],
  attacker?: PlayerState | null,
): PopupOption[] {
  let popupOptions = [...currentOptions];

  if (popupOptions.length > 2) return popupOptions;
  if (ignoresOpposingTableau(attacker)) return popupOptions;
  if (!canUseHideCards(player)) return popupOptions;

  if (player.power.includes("mundungus_fletcher")) {
    popupOptions.push({
      label: "Try to hide as Mundungus",
      function: "houseHide",
    });
  }

  if (cardsIncludeName(player.tableau, "vanishing_cabinet")) {
    popupOptions.push({
      label: "Try to hide in your vanishing cabinet!",
      function: "houseHide",
    });
  }

  if (cardsIncludeName(player.tableau, "invisibility_cloak")) {
    popupOptions.push({
      label: "Try to hide with your invisibility cloak!",
      function: "invisibilityHide",
    });
  }

  if (
    cardsIncludeName(player.tableau, "vanishing_cabinet") &&
    cardsIncludeName(player.tableau, "invisibility_cloak")
  ) {
    popupOptions = [
      {
        label: "Hide, invisible, in your vanishing cabinet.",
        function: "clearEvent",
      },
    ];
  }

  return popupOptions;
}

export const targetTokensForEvent = (event: GameEvent): GameplayTarget[] => {
  if (event.cardType === "resolution") return [];
  return [];
};
