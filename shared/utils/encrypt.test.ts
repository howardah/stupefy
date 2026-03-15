import { describe, expect, test } from "bun:test";
import { decode, encode } from "./encrypt";

describe("encrypt helpers", () => {
  test("encode and decode round-trip supported characters", () => {
    const source = "Abc123!@$_+,.<>";
    const key = "MagicKey7";

    const encoded = encode(source, key);

    expect(encoded).not.toBe(source);
    expect(decode(encoded, key)).toBe(source);
  });

  test("decode handles wrapped subtraction correctly", () => {
    const encoded = encode("aA1!", "Z9");

    expect(decode(encoded, "Z9")).toBe("aA1!");
  });
});
