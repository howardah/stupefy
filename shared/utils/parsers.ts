import type {
  CardPower,
  DeckState,
  GameEventBystanderKey,
  GameCard,
  GameEvent,
  GameState,
  House,
  PlayerCharacterState,
  PlayerState,
  PopupState,
  PopupType,
  Role,
  TurnActionName,
  TurnCycle,
  TurnCyclePhase,
  TurnCyclePlayerKey,
  TurnCyclePlayerState,
  WaitingChatMessage,
  WaitingPlayer,
  WaitingRoomState,
} from "./types";
import {
  CHARACTER_POWER_NAMES,
  POPUP_TYPES,
  TURN_ACTION_NAMES,
  TURN_CYCLE_PHASES,
  TURN_CYCLE_USED_ENTRIES,
} from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asHouse(value: unknown): House {
  return value === "G" || value === "H" || value === "R" || value === "S" || value === ""
    ? value
    : "";
}

function asRole(value: unknown): Role | undefined {
  return value === "auror" ||
    value === "death eater" ||
    value === "minister" ||
    value === "werewolf"
    ? value
    : undefined;
}

function asPopupType(value: unknown): PopupType | undefined {
  return typeof value === "string" && POPUP_TYPES.includes(value as PopupType)
    ? (value as PopupType)
    : undefined;
}

function asTurnActionName(value: unknown): TurnActionName {
  return typeof value === "string" && TURN_ACTION_NAMES.includes(value as TurnActionName)
    ? (value as TurnActionName)
    : "";
}

function asTurnCyclePhase(value: unknown): TurnCyclePhase {
  return typeof value === "string" && TURN_CYCLE_PHASES.includes(value as TurnCyclePhase)
    ? (value as TurnCyclePhase)
    : "unset";
}

function isTurnCyclePlayerKey(key: string): key is TurnCyclePlayerKey {
  return /^id\d+$/.test(key);
}

function isGameEventBystanderKey(key: string): key is GameEventBystanderKey {
  return /^bystanders-\d+$/.test(key);
}

function isCharacterPowerName(value: unknown): value is PlayerState["power"][number] {
  return (
    typeof value === "string" &&
    CHARACTER_POWER_NAMES.includes(value as PlayerState["power"][number])
  );
}

function isTurnCycleUsedEntry(value: unknown): value is TurnCycle["used"][number] {
  return (
    typeof value === "string" &&
    TURN_CYCLE_USED_ENTRIES.includes(value as TurnCycle["used"][number])
  );
}

function asPopupOption(value: unknown): PopupState["options"][number] {
  if (!isObject(value)) {
    return { function: "", label: "" };
  }

  return {
    function: typeof value.function === "string" ? value.function : "",
    label: typeof value.label === "string" ? value.label : "",
  };
}

function asCardPower(value: unknown): CardPower {
  if (!isObject(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) =>
        typeof entry === "boolean" ||
        typeof entry === "number" ||
        typeof entry === "string" ||
        typeof entry === "undefined",
    ),
  ) as CardPower;
}

function asGameCard(value: unknown): GameCard {
  if (!isObject(value)) {
    return { name: "", power: {} };
  }

  return {
    fileName: typeof value.fileName === "string" ? value.fileName : undefined,
    house: typeof value.house === "string" ? asHouse(value.house) : undefined,
    id: typeof value.id === "number" ? value.id : undefined,
    name: typeof value.name === "string" ? value.name : "",
    power: asCardPower(value.power),
  };
}

function asPlayerCharacter(value: unknown): PlayerCharacterState {
  if (Array.isArray(value)) {
    return value.map((entry) => ({
      fileName: typeof entry?.fileName === "string" ? entry.fileName : "",
      health: typeof entry?.health === "number" ? entry.health : 0,
      house: asHouse(entry?.house),
      maxHealth: typeof entry?.maxHealth === "number" ? entry.maxHealth : 0,
      name: typeof entry?.name === "string" ? entry.name : "",
      power: asCardPower(entry?.power),
      shortName: typeof entry?.shortName === "string" ? entry.shortName : "",
    }));
  }

  if (!isObject(value)) {
    return [];
  }

  return {
    fileName: typeof value.fileName === "string" ? value.fileName : "",
    health: typeof value.health === "number" ? value.health : 0,
    house: asHouse(value.house),
    maxHealth: typeof value.maxHealth === "number" ? value.maxHealth : 0,
    name: typeof value.name === "string" ? value.name : "",
    power: asCardPower(value.power),
    shortName: typeof value.shortName === "string" ? value.shortName : "",
  };
}

function asPlayerState(value: unknown): PlayerState {
  if (!isObject(value)) {
    return {
      character: [],
      hand: [],
      id: 0,
      name: "",
      power: [],
      tableau: [],
    };
  }

  return {
    ...value,
    character: asPlayerCharacter(value.character),
    hand: Array.isArray(value.hand) ? value.hand.map(asGameCard) : [],
    id: typeof value.id === "number" ? value.id : 0,
    name: typeof value.name === "string" ? value.name : "",
    power: Array.isArray(value.power) ? value.power.filter(isCharacterPowerName) : [],
    role: asRole(value.role),
    tableau: Array.isArray(value.tableau) ? value.tableau.map(asGameCard) : [],
  };
}

function asTurnCycle(value: unknown): TurnCycle {
  if (!isObject(value)) {
    return {
      action: "",
      cards: [],
      draw: 0,
      felix: [],
      hotseat: -1,
      phase: "unset",
      shots: 0,
      used: [],
    };
  }

  const turnCycle: TurnCycle = {
    action: asTurnActionName(value.action),
    cards: Array.isArray(value.cards) ? value.cards.map(asGameCard) : [],
    draw: typeof value.draw === "number" ? value.draw : 0,
    felix: Array.isArray(value.felix) ? value.felix.map(asPlayerState) : [],
    hotseat: typeof value.hotseat === "number" ? value.hotseat : -1,
    phase: asTurnCyclePhase(value.phase),
    shots: typeof value.shots === "number" ? value.shots : 0,
    used: Array.isArray(value.used) ? value.used.filter(isTurnCycleUsedEntry) : [],
  };

  if (isObject(value.afterDeath)) {
    turnCycle.afterDeath = {
      action: asTurnActionName(value.afterDeath.action),
      phase: asTurnCyclePhase(value.afterDeath.phase),
    };
  }

  for (const [key, entry] of Object.entries(value)) {
    if (!isTurnCyclePlayerKey(key) || !isObject(entry)) {
      continue;
    }

    turnCycle[key] = {
      cards: Array.isArray(entry.cards) ? entry.cards.map(asGameCard) : [],
      choice: typeof entry.choice === "string" ? entry.choice : undefined,
    } satisfies TurnCyclePlayerState;
  }

  return turnCycle;
}

function asPopupState(value: unknown): PopupState | undefined {
  if (!isObject(value)) return undefined;
  return {
    canDismiss: typeof value.canDismiss === "boolean" ? value.canDismiss : undefined,
    message: typeof value.message === "string" ? value.message : "",
    options: Array.isArray(value.options) ? value.options.map(asPopupOption) : [],
    popupType: asPopupType(value.popupType),
  };
}

function asGameEvent(value: unknown): GameEvent {
  if (!isObject(value)) return { target: [] };

  const bystanderPopups = Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => isGameEventBystanderKey(key))
      .map(([key, entry]) => [key, asPopupState(entry)])
      .filter(([, entry]) => entry),
  ) as Partial<Record<GameEventBystanderKey, PopupState>>;

  return {
    bystanders: asPopupState(value.bystanders),
    cardType: typeof value.cardType === "string" ? value.cardType : undefined,
    deck: value.deck ? parseDeckState(value.deck) : undefined,
    instigator: value.instigator ? asPlayerState(value.instigator) : undefined,
    popup: asPopupState(value.popup),
    table: Array.isArray(value.table) ? value.table.map(asGameCard) : undefined,
    target: Array.isArray(value.target) ? [...value.target] : [],
    ...bystanderPopups,
  };
}

export function parseDeckState(value: unknown): DeckState {
  if (!isObject(value)) return { cards: [], discards: [] };
  return {
    cards: Array.isArray(value.cards) ? value.cards.map(asGameCard) : [],
    discards: Array.isArray(value.discards) ? value.discards.map(asGameCard) : [],
  };
}

export function parseGameState(value: unknown): GameState | null {
  if (!isObject(value)) return null;

  return {
    _id: typeof value._id === "number" ? value._id : undefined,
    archivedAt: typeof value.archivedAt === "number" ? value.archivedAt : undefined,
    createdAt: typeof value.createdAt === "number" ? value.createdAt : undefined,
    deadPlayers: Array.isArray(value.deadPlayers)
      ? value.deadPlayers.filter((entry): entry is number => typeof entry === "number")
      : [],
    deck: parseDeckState(value.deck),
    events: Array.isArray(value.events) ? value.events.map(asGameEvent) : [],
    expiresAt: typeof value.expiresAt === "number" ? value.expiresAt : undefined,
    players: Array.isArray(value.players) ? value.players.map(asPlayerState) : [],
    sourceWaitingRoom:
      typeof value.sourceWaitingRoom === "string" ? value.sourceWaitingRoom : undefined,
    startedAt: typeof value.startedAt === "number" ? value.startedAt : undefined,
    status: value.status === "active" || value.status === "archived" ? value.status : undefined,
    table: Array.isArray(value.table) ? value.table.map(asGameCard) : [],
    turn: typeof value.turn === "number" ? value.turn : 0,
    turnCycle: asTurnCycle(value.turnCycle),
    turnOrder: Array.isArray(value.turnOrder)
      ? value.turnOrder.filter((entry): entry is number => typeof entry === "number")
      : [],
    last_updated: typeof value.last_updated === "number" ? value.last_updated : undefined,
  };
}

export function parseWaitingPlayer(value: unknown): WaitingPlayer {
  if (!isObject(value)) return { id: 0, name: "" };
  return {
    id: typeof value.id === "number" ? value.id : 0,
    name: typeof value.name === "string" ? value.name : "",
  };
}

export function parseWaitingChatMessage(value: unknown): WaitingChatMessage {
  if (!isObject(value)) return { player: 0, text: "", time: 0 };
  return {
    player: typeof value.player === "number" ? value.player : 0,
    text: typeof value.text === "string" ? value.text : "",
    time: typeof value.time === "number" ? value.time : 0,
  };
}

export function parseWaitingRoomState(value: unknown): WaitingRoomState | null {
  if (!isObject(value)) return null;

  const active: Record<string, number | string> = isObject(value.active)
    ? (Object.fromEntries(
        Object.entries(value.active).filter(
          ([, entry]) => typeof entry === "number" || typeof entry === "string",
        ),
      ) as Record<string, number | string>)
    : {};

  const activeUpdatedAt: Record<string, number> = isObject(value.activeUpdatedAt)
    ? (Object.fromEntries(
        Object.entries(value.activeUpdatedAt).filter(([, entry]) => typeof entry === "number"),
      ) as Record<string, number>)
    : {};

  const ready: Record<string, boolean> = isObject(value.ready)
    ? (Object.fromEntries(
        Object.entries(value.ready).filter(([, entry]) => typeof entry === "boolean"),
      ) as Record<string, boolean>)
    : {};

  return {
    _id: typeof value._id === "number" ? value._id : undefined,
    active,
    activeUpdatedAt,
    archivedAt: typeof value.archivedAt === "number" ? value.archivedAt : undefined,
    chat: Array.isArray(value.chat) ? value.chat.map(parseWaitingChatMessage) : [],
    createdAt: typeof value.createdAt === "number" ? value.createdAt : undefined,
    expiresAt: typeof value.expiresAt === "number" ? value.expiresAt : undefined,
    gameRoomKey: typeof value.gameRoomKey === "string" ? value.gameRoomKey : undefined,
    last_updated: typeof value.last_updated === "number" ? value.last_updated : undefined,
    password:
      value.password === false || typeof value.password === "string" ? value.password : false,
    players: Array.isArray(value.players) ? value.players.map(parseWaitingPlayer) : [],
    ready,
    roomName: typeof value.roomName === "string" ? value.roomName : "",
    startedAt: typeof value.startedAt === "number" ? value.startedAt : undefined,
    status:
      value.status === "waiting" || value.status === "in-game" || value.status === "archived"
        ? value.status
        : undefined,
  };
}
