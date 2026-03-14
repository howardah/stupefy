import { describe, expect, test } from "bun:test";
import roles from "./roles";

const expectedRoleCounts: Record<number, Record<string, number>> = {
  2: { minister: 1, "death eater": 1 },
  3: { minister: 1, "death eater": 1, werewolf: 1 },
  4: { minister: 1, "death eater": 2, werewolf: 1 },
  5: { minister: 1, "death eater": 2, werewolf: 1, auror: 1 },
  6: { minister: 1, "death eater": 3, werewolf: 1, auror: 1 },
  7: { minister: 1, "death eater": 3, werewolf: 1, auror: 2 },
  8: { minister: 1, "death eater": 3, werewolf: 2, auror: 2 },
  9: { minister: 1, "death eater": 4, werewolf: 2, auror: 2 },
};

describe("role generation", () => {
  test.each(Object.entries(expectedRoleCounts))(
    "returns the expected role mix for %s players",
    (playerCount: string, counts: Record<string, number>) => {
      const generated = roles(Number(playerCount));

      expect(generated).toHaveLength(Number(playerCount));

      for (const [role, count] of Object.entries(counts)) {
        expect(generated.filter((entry) => entry === role)).toHaveLength(count);
      }
    },
  );

  test("returns no roles outside the supported player counts", () => {
    expect(roles(1)).toEqual([]);
    expect(roles(10)).toEqual([]);
  });
});
