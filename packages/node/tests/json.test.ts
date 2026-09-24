import { describe, expect, it } from "vitest";
import { JSON } from "../src/builtins/json.ts";

describe("JSON", () => {
  it("parse returns ok for valid JSON", () => {
    const result = JSON.parse('{"a":1}');

    if (result.isOkay()) {
      expect(result.value).toEqual({ a: 1 });
    } else {
      expect.unreachable();
    }
  });

  it("parse returns err for invalid JSON", () => {
    const result = JSON.parse("{");

    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(Error);
    } else {
      expect.unreachable();
    }
  });

  it("stringify returns ok for plain values", () => {
    const result = JSON.stringify({ a: 1 });

    if (result.isOkay()) {
      expect(result.value).toBe('{"a":1}');
    } else {
      expect.unreachable();
    }
  });

  it("stringify returns err for circular objects", () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;

    const result = JSON.stringify(circular);

    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(Error);
    } else {
      expect.unreachable();
    }
  });
});
