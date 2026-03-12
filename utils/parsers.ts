import type {
  CardPower,
  DeckState,
  GameCard,
  GameEvent,
  GameState,
  PlayerCharacterState,
  PlayerState,
  PopupState,
  TurnCycle,
  WaitingChatMessage,
  WaitingPlayer,
  WaitingRoomState,
} from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asCardPower(value: unknown): CardPower {
  if (!isObject(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) =>
      typeof entry === "boolean" ||
      typeof entry === "number" ||
      typeof entry === "string" ||
      typeof entry === "undefined"
    )
  ) as CardPower;
}

function asGameCard(value: unknown): GameCard {
  if (!isObject(value)) {
    return { name: "", power: {} };
  }

  return {
    fileName: typeof value.fileName === "string" ? value.fileName : undefined,
    house: typeof value.house === "string" ? (value.house as GameCard["house"]) : undefined,
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
    house: typeof entry?.house === "string" ? (entry.house as "") : "",
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
    house: typeof value.house === "string" ? (value.house as "") : "",
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
    power: Array.isArray(value.power) ? [...value.power] : [],
    role:
      value.role === "auror" ||
      value.role === "death eater" ||
      value.role === "minister" ||
      value.role === "werewolf"
        ? value.role
        : undefined,
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

  return {
    action: typeof value.action === "string" ? value.action : "",
    cards: Array.isArray(value.cards) ? value.cards.map(asGameCard) : [],
    draw: typeof value.draw === "number" ? value.draw : 0,
    felix: Array.isArray(value.felix) ? value.felix.map(asGameCard) : [],
    hotseat: typeof value.hotseat === "number" ? value.hotseat : -1,
    phase: typeof value.phase === "string" ? value.phase : "unset",
    shots: typeof value.shots === "number" ? value.shots : 0,
    used: Array.isArray(value.used) ? [...value.used] : [],
  };
}

function asPopupState(value: unknown): PopupState | undefined {
  if (!isObject(value)) return undefined;
  return {
    message: typeof value.message === "string" ? value.message : "",
    options: Array.isArray(value.options) ? (value.options as PopupState["options"]) : [],
    popupType: typeof value.popupType === "string" ? value.popupType : undefined,
  };
}

function asGameEvent(value: unknown): GameEvent {
  if (!isObject(value)) return { target: [] };
  return {
    ...value,
    bystanders: asPopupState(value.bystanders),
    cardType: typeof value.cardType === "string" ? value.cardType : undefined,
    popup: asPopupState(value.popup),
    target: Array.isArray(value.target) ? [...value.target] : [],
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
    ...value,
    deadPlayers: Array.isArray(value.deadPlayers)
      ? value.deadPlayers.filter((entry): entry is number => typeof entry === "number")
      : [],
    deck: parseDeckState(value.deck),
    events: Array.isArray(value.events) ? value.events.map(asGameEvent) : [],
    players: Array.isArray(value.players) ? value.players.map(asPlayerState) : [],
    table: Array.isArray(value.table) ? value.table.map(asGameCard) : [],
    turn: typeof value.turn === "number" ? value.turn : 0,
    turnCycle: asTurnCycle(value.turnCycle),
    turnOrder: Array.isArray(value.turnOrder)
      ? value.turnOrder.filter((entry): entry is number => typeof entry === "number")
      : [],
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
    ...value,
    player: typeof value.player === "number" ? value.player : 0,
    text: typeof value.text === "string" ? value.text : "",
    time: typeof value.time === "number" ? value.time : 0,
  };
}

export function parseWaitingRoomState(value: unknown): WaitingRoomState | null {
  if (!isObject(value)) return null;

  const active: Record<string, number | string> = isObject(value.active)
    ? Object.fromEntries(
        Object.entries(value.active).filter(([, entry]) =>
          typeof entry === "number" || typeof entry === "string"
        )
      ) as Record<string, number | string>
    : {};

  const activeUpdatedAt: Record<string, number> = isObject(value.activeUpdatedAt)
    ? Object.fromEntries(
        Object.entries(value.activeUpdatedAt).filter(
          ([, entry]) => typeof entry === "number"
        )
      ) as Record<string, number>
    : {};

  const ready: Record<string, boolean> = isObject(value.ready)
    ? Object.fromEntries(
        Object.entries(value.ready).filter(([, entry]) => typeof entry === "boolean")
      ) as Record<string, boolean>
    : {};

  return {
    ...value,
    active,
    activeUpdatedAt,
    chat: Array.isArray(value.chat) ? value.chat.map(parseWaitingChatMessage) : [],
    password:
      value.password === false || typeof value.password === "string"
        ? value.password
        : false,
    players: Array.isArray(value.players) ? value.players.map(parseWaitingPlayer) : [],
    ready,
    roomName: typeof value.roomName === "string" ? value.roomName : "",
  };
}
