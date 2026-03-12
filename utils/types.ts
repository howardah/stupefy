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

export interface PlayerState {
  id: number;
  name: string;
  role?: Role;
  tableau: GameCard[];
  hand: GameCard[];
  power: unknown[];
  character: CharacterCard[];
  [key: string]: unknown;
}

export interface TurnCycle {
  action: string;
  cards: GameCard[];
  felix: GameCard[];
  draw: number;
  hotseat: number;
  phase: string;
  shots: number;
  used: unknown[];
}

export interface GameState {
  _id?: number;
  deck: unknown;
  players: PlayerState[];
  turn: number;
  turnCycle: TurnCycle;
  turnOrder: number[];
  last_updated?: number;
  [key: string]: unknown;
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
  chat: WaitingChatMessage[];
  last_updated?: number;
  password: false | string;
  players: WaitingPlayer[];
  roomName: string;
  [key: string]: unknown;
}

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
