export type House = "" | "G" | "H" | "R" | "S";

export type Role = "auror" | "death eater" | "minister" | "werewolf";

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
  power: unknown[];
  character: PlayerCharacterState;
  [key: string]: unknown;
}

export interface DeckState {
  cards: GameCard[];
  discards: GameCard[];
  drawCards?: (number: number, discard?: boolean) => GameCard[];
  getLength?: () => number;
  shuffle?: () => void;
}

export interface TurnCycle {
  action: string;
  cards: GameCard[];
  felix: PlayerState[];
  draw: number;
  hotseat: number;
  phase: string;
  shots: number;
  used: unknown[];
  [key: string]: unknown;
}

export interface TurnCyclePlayerState {
  cards: GameCard[];
  choice?: string;
}

export type RealtimeTransportStrategy = "polling";

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
  message: string;
  options: PopupOption[];
  popupType?: string;
}

export interface GameEvent {
  bystanders?: PopupState;
  cardType?: string;
  deck?: DeckState;
  instigator?: PlayerState;
  popup?: PopupState;
  table?: GameCard[];
  target: Array<number | string>;
  [key: string]: unknown;
}

export interface GameState {
  _id?: number;
  deadPlayers?: number[];
  deck: DeckState;
  events?: GameEvent[];
  table?: GameCard[];
  players: PlayerState[];
  turn: number;
  turnCycle: TurnCycle;
  turnOrder: number[];
  last_updated?: number;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface WaitingRoomState {
  active?: Record<string, number | string>;
  activeUpdatedAt?: Record<string, number>;
  chat: WaitingChatMessage[];
  last_updated?: number;
  password: false | string;
  players: WaitingPlayer[];
  ready?: Record<string, boolean>;
  roomName: string;
  [key: string]: unknown;
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
