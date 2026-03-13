export type House = "" | "G" | "H" | "R" | "S";

export type Role = "auror" | "death eater" | "minister" | "werewolf";

export const CHARACTER_POWER_NAMES = [
  "albus_dumbledore",
  "arthur_weasley",
  "bellatrix_lestrange",
  "cedric_diggory",
  "dobby",
  "dolores_umbridge",
  "draco_malfoy",
  "fenrir_greyback",
  "fred_and_george",
  "gilderoy_lockhart",
  "ginny_weasley",
  "harry_potter",
  "hermione_granger",
  "james_potter",
  "lily_potter",
  "lucius_malfoy",
  "luna_lovegood",
  "mad-eye_moody",
  "minerva_mchonagall",
  "molly_weasley",
  "mundungus_fletcher",
  "neville_longbottom",
  "nymphadora_tonks",
  "peeves",
  "peter_pettigrew",
  "remus_lupin",
  "ron_weasley",
  "rubeus_hagrid",
  "severus_snape",
  "sirius_black",
  "voldemort",
] as const;

export type CharacterPowerName = (typeof CHARACTER_POWER_NAMES)[number];

export const TURN_CYCLE_USED_ENTRIES = [
  "cedric_bonus",
  "dobby_stupefy",
  "fred_and_george",
  "james_potter",
  "minerva_mchonagall",
  "ressurection_stone",
  "tonks_copy",
] as const;

export type TurnCycleUsedEntry = (typeof TURN_CYCLE_USED_ENTRIES)[number];

export const POPUP_TYPES = ["resolution", "subtle"] as const;

export type PopupType = (typeof POPUP_TYPES)[number];

export type GameCardName =
  | "accio"
  | "apparate"
  | "aspen_wand"
  | "azkaban"
  | "broomstick"
  | "butterbeer"
  | "dementors"
  | "diagon_alley"
  | "elder_wand"
  | "expecto_patronum"
  | "expelliarmus"
  | "felix_felicis"
  | "fiendfyre"
  | "garroting_gas"
  | "holly_wand"
  | "honeydukes"
  | "invisibility_cloak"
  | "larch_wand"
  | "polyjuice_potion"
  | "protego"
  | "resurrection_stone"
  | "stupefy"
  | "three_broomsticks"
  | "vanishing_cabinet"
  | "weasleys_wizard_weezes"
  | "wizards_duel"
  | "yew_wand";

export const TURN_ACTION_NAMES = [
  "",
  "accio",
  "apparate",
  "aspen_wand",
  "azkaban",
  "broomstick",
  "butterbeer",
  "death",
  "dementors",
  "diagon_alley",
  "discard",
  "discardEvent",
  "dobby_punish_stupefy",
  "dobby_stupefy",
  "elder_wand",
  "expecto_patronum",
  "expelliarmus",
  "felix",
  "felix_felicis",
  "fenrir_stupefy",
  "fiendfyre",
  "garroting_gas",
  "holly_wand",
  "honeydukes",
  "invisibility_cloak",
  "james_potter",
  "larch_wand",
  "minerva_mchonagall",
  "molly_protego",
  "neville_longbottom",
  "peeves_draw",
  "peter_pettigrew",
  "polyjuice_potion",
  "protego",
  "ressurection_stone",
  "resurrection_stone",
  "ron_weasley",
  "stupefy",
  "three_broomsticks",
  "tonks_copy",
  "vanishing_cabinet",
  "weasleys_wizard_weezes",
  "wizards_duel",
  "yew_wand",
] as const;

export type TurnActionName = (typeof TURN_ACTION_NAMES)[number];

export const TURN_CYCLE_PHASES = [
  "attack",
  "azkaban",
  "death",
  "diagon_alley",
  "discard",
  "felix",
  "fred-george-discard",
  "initial",
  "ressurection_stone",
  "ressurection_stone-discards",
  "resurrection_stone",
  "selected",
  "selected-stuck-in-azkaban",
  "selected-tableau",
  "start-turn",
  "stuck-in-azkaban",
  "unset",
] as const;

export type TurnCyclePhase = (typeof TURN_CYCLE_PHASES)[number];
export type TurnCyclePlayerKey = `id${number}`;
export type GameEventBystanderKey = `bystanders-${number}`;

export function isCharacterPowerName(value: string | undefined): value is CharacterPowerName {
  return typeof value === "string" && CHARACTER_POWER_NAMES.includes(value as CharacterPowerName);
}

export function toTurnActionName(value: string | undefined, fallback: TurnActionName = ""): TurnActionName {
  return typeof value === "string" && TURN_ACTION_NAMES.includes(value as TurnActionName)
    ? (value as TurnActionName)
    : fallback;
}

export interface CardPower {
  [key: string]: boolean | number | string | undefined;
}

export interface GameCard {
  id?: number;
  name: string;
  fileName?: string;
  house?: House;
  power: CardPower;
}

export interface CharacterCard {
  fileName: string;
  name: string;
  shortName: string;
  house: House;
  health: number;
  maxHealth: number;
  power: CardPower;
}

export type PlayerCharacterState = CharacterCard | CharacterCard[];

export interface PlayerState {
  id: number;
  name: string;
  role?: Role;
  tableau: GameCard[];
  hand: GameCard[];
  power: CharacterPowerName[];
  character: PlayerCharacterState;
}

export interface DeckState {
  cards: GameCard[];
  discards: GameCard[];
  drawCards?: (number: number, discard?: boolean) => GameCard[];
  getLength?: () => number;
  shuffle?: () => void;
}

export interface TurnCycle {
  action: TurnActionName;
  cards: GameCard[];
  felix: PlayerState[];
  draw: number;
  hotseat: number;
  phase: TurnCyclePhase;
  shots: number;
  used: TurnCycleUsedEntry[];
  afterDeath?: TurnCycleResumeState;
  [key: TurnCyclePlayerKey]: TurnCyclePlayerState | undefined;
}

export interface TurnCyclePlayerState {
  cards: GameCard[];
  choice?: string;
}

export interface TurnCycleResumeState {
  action: TurnActionName;
  phase: TurnCyclePhase;
}

export type RealtimeTransportStrategy = "polling";

export type GameRoomStatus = "active" | "archived";
export type WaitingRoomStatus = "waiting" | "in-game" | "archived";

export type RealtimeRoomStatus =
  | "connected"
  | "disabled"
  | "error"
  | "idle"
  | "reconnecting"
  | "syncing";

export interface RealtimeEventMap {
  "room:join": {
    playerId: number;
    room: string;
  };
  "room:pause": {
    playerId: number;
    room: string;
  };
  "room:resume": {
    playerId: number;
    room: string;
  };
  "room:sync": {
    expectedLastUpdated?: number;
    playerId: number;
    room: string;
    transport: RealtimeTransportStrategy;
  };
  "wait:chat": {
    room: string;
    transport: RealtimeTransportStrategy;
  };
  "wait:presence": {
    room: string;
    transport: RealtimeTransportStrategy;
  };
}

export type GameplayTarget =
  | "between-characters"
  | "characters"
  | "discard"
  | "draw"
  | "hand"
  | "my-character"
  | "my-hand"
  | "my-tableau"
  | "my-tableau-empty"
  | "range"
  | "table"
  | "table-empty"
  | "tableau"
  | "tableau-empty"
  | "wand-range";

export interface PopupOption {
  function: string;
  label: string;
}

export interface PopupState {
  canDismiss?: boolean;
  message: string;
  options: PopupOption[];
  popupType?: PopupType;
}

export interface GameEvent {
  bystanders?: PopupState;
  cardType?: string;
  deck?: DeckState;
  instigator?: PlayerState;
  popup?: PopupState;
  table?: GameCard[];
  target: Array<number | string>;
  [key: GameEventBystanderKey]: PopupState | undefined;
}

export interface GameState {
  _id?: number;
  archivedAt?: number;
  createdAt?: number;
  deadPlayers?: number[];
  deck: DeckState;
  events?: GameEvent[];
  expiresAt?: number;
  table?: GameCard[];
  players: PlayerState[];
  sourceWaitingRoom?: string;
  startedAt?: number;
  status?: GameRoomStatus;
  turn: number;
  turnCycle: TurnCycle;
  turnOrder: number[];
  last_updated?: number;
}

export type GameRoomDocument = GameState;
export type GameRoomApiResponse = GameState[] | false;

export interface GameRoomSyncRequest {
  data: Partial<GameState>;
  expectedLastUpdated?: number;
  playerId: number;
  room: string;
  transport: RealtimeTransportStrategy;
}

export interface GameRoomSyncResponse {
  conflict: boolean;
  ok: boolean;
  room: GameState | null;
  transport: RealtimeTransportStrategy;
  updated: boolean;
}

export interface PlayQuery {
  id: number;
  key?: string;
  room: string;
}

export interface BoardViewState {
  actions: PopupState;
  alerts: string[];
  deadPlayers: number[];
  deck: DeckState;
  events: GameEvent[];
  playerId: number;
  playerRoom: string;
  players: PlayerState[];
  running: boolean;
  showCards: boolean;
  table: GameCard[];
  turn: number;
  turnCycle: TurnCycle;
  turnOrder: number[];
}

export type BoardMutationKind = "gameplay" | "presentation";

export interface BoardAlert {
  id: string;
  message: string;
  tone?: "error" | "info" | "warning";
}

export interface WaitingPlayer {
  id: number;
  name: string;
}

export interface WaitingChatMessage {
  player: number;
  text: string;
  time: number;
}

export interface WaitingRoomState {
  _id?: number;
  active?: Record<string, number | string>;
  activeUpdatedAt?: Record<string, number>;
  archivedAt?: number;
  chat: WaitingChatMessage[];
  createdAt?: number;
  expiresAt?: number;
  gameRoomKey?: string;
  last_updated?: number;
  password: false | string;
  players: WaitingPlayer[];
  ready?: Record<string, boolean>;
  roomName: string;
  startedAt?: number;
  status?: WaitingRoomStatus;
}

export type WaitingRoomDocument = WaitingRoomState;
export type WaitingRoomApiResponse = Array<ErrorResult | WaitingRoomState>;

export interface ErrorResult {
  error: string;
}

export interface WaitingRoomJoinQuery {
  player: string;
  pw?: string;
  room: string;
}

export interface WaitingRoomGetQuery {
  id: number | string;
  key: string;
  room: string;
}

export interface WaitingRoomCreateQuery {
  player: string;
  pw?: string;
  room: string;
}

export interface WaitingRoomAccessState {
  exists: boolean;
  hasPassword: boolean;
  roomName: string;
}

export interface OpenWaitingRoomSummary {
  activeCount: number;
  playerCount: number;
  roomName: string;
  updatedAt: number;
}
