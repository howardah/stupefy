import type { CardPower, CharacterCard, House } from "../types";

export interface MainDeckCatalogEntry {
  count?: number;
  fileNames?: string[];
  house?: House;
  name: string;
  power: CardPower;
}

export type CharacterCatalogEntry = CharacterCard;
