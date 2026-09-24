import { describe, expect, it } from "vitest";
import { structuredClone } from "../src/builtins/structured-clone.ts";

describe("structuredClone", () => {
  it("returns ok for plain objects", () => {
    const value = { a: 1, nested: { b: true } };
    const result = structuredClone(value);

    if (result.isOkay()) {
      expect(result.value).toEqual(value);
      expect(result.value).not.toBe(value);
    } else {
      expect.unreachable();
    }
  });

  it("returns err for non-cloneable values", () => {
    const result = structuredClone(() => 1);

    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(Error);
    } else {
      expect.unreachable();
    }
  });
});
