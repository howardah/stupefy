import type { GameCard, House } from "../types";
import type { MainDeckCatalogEntry } from "./catalog-types";
import { MAIN_DECK_CATALOG } from "./main-deck-catalog";

function createHousePool(): House[] {
  return Array(82).fill("G", 0, 20).fill("R", 20, 41).fill("S", 41, 61).fill("H", 61, 82);
}

function chooseFileName(entry: MainDeckCatalogEntry): string {
  if (!entry.fileNames || entry.fileNames.length === 0) {
    return entry.name;
  }

  return entry.fileNames[Math.floor(Math.random() * entry.fileNames.length)]!;
}

function expandCatalogEntry(entry: MainDeckCatalogEntry): Omit<GameCard, "house" | "id">[] {
  const count = entry.count ?? 1;

  return Array.from({ length: count }, () => ({
    fileName: chooseFileName(entry),
    name: entry.name,
    power: { ...entry.power },
  }));
}

export function buildMainDeck(): GameCard[] {
  const houses = createHousePool();
  const recipe = MAIN_DECK_CATALOG.flatMap(expandCatalogEntry);

  return recipe.map((card, index) => ({
    id: index,
    name: card.name,
    fileName: card.fileName || card.name,
    power: { ...card.power },
    house: houses.splice(Math.floor(Math.random() * houses.length), 1)[0],
  }));
}
