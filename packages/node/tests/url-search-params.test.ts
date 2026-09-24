import { describe, expect, it } from "vitest";
import { unwrap } from "../src/builtins/inner.ts";
import { URLSearchParams } from "../src/builtins/url-search-params.ts";

describe("URLSearchParams", () => {
  it("from constructs from a query string", () => {
    const result = URLSearchParams.from("a=1&b=2");

    if (result.isOkay()) {
      expect(result.value).toBeInstanceOf(URLSearchParams);
      expect(unwrap<globalThis.URLSearchParams>(result.value)).toBeInstanceOf(
        globalThis.URLSearchParams,
      );
      expect(result.value.get("a")).toBe("1");
      expect(result.value.get("b")).toBe("2");
      expect(result.value.toString()).toBe("a=1&b=2");
    } else {
      expect.unreachable();
    }
  });

  it("from constructs from a record", () => {
    const result = URLSearchParams.from({ a: "1", b: "2" });

    if (result.isOkay()) {
      expect(result.value.get("a")).toBe("1");
      expect(result.value.get("b")).toBe("2");
    } else {
      expect.unreachable();
    }
  });

  it("from constructs from a sequence of pairs", () => {
    const result = URLSearchParams.from([
      ["a", "1"],
      ["a", "2"],
      ["b", "3"],
    ]);

    if (result.isOkay()) {
      expect(result.value.getAll("a")).toEqual(["1", "2"]);
      expect(result.value.size).toBe(3);
    } else {
      expect.unreachable();
    }
  });

  it("from wraps a native URLSearchParams without cloning", () => {
    const native = new globalThis.URLSearchParams("x=1");
    const result = URLSearchParams.from(native);

    if (result.isOkay()) {
      expect(unwrap<globalThis.URLSearchParams>(result.value)).toBe(native);
      native.append("y", "2");
      expect(result.value.get("y")).toBe("2");
    } else {
      expect.unreachable();
    }
  });

  it("from live-wraps a sigur URLSearchParams", () => {
    const first = URLSearchParams.from("a=1");

    if (!first.isOkay()) {
      expect.unreachable();
      return;
    }

    const second = URLSearchParams.from(first.value);

    if (second.isOkay()) {
      expect(unwrap<globalThis.URLSearchParams>(second.value)).toBe(
        unwrap<globalThis.URLSearchParams>(first.value),
      );
    } else {
      expect.unreachable();
    }
  });

  it("from returns err when native construction throws", () => {
    const result = URLSearchParams.from([["a"]] as unknown as string[][]);

    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(TypeError);
    } else {
      expect.unreachable();
    }
  });

  it("from with no init yields empty params", () => {
    const result = URLSearchParams.from();

    if (result.isOkay()) {
      expect(result.value.size).toBe(0);
      expect(result.value.toString()).toBe("");
    } else {
      expect.unreachable();
    }
  });

  it("core MDN methods work through the wrapper", () => {
    const result = URLSearchParams.from("a=1");

    if (!result.isOkay()) {
      expect.unreachable();
      return;
    }

    const params = result.value;

    params.append("a", "2");
    params.set("b", "3");

    expect(params.get("a")).toBe("1");
    expect(params.getAll("a")).toEqual(["1", "2"]);
    expect(params.has("a")).toBe(true);
    expect(params.has("a", "2")).toBe(true);
    expect(params.has("a", "9")).toBe(false);
    expect(params.size).toBe(3);

    params.delete("a", "1");

    expect(params.getAll("a")).toEqual(["2"]);
    expect(params.toString()).toBe("a=2&b=3");

    params.sort();

    expect(params.toString()).toBe("a=2&b=3");
    expect([...params]).toEqual([
      ["a", "2"],
      ["b", "3"],
    ]);
    expect([...params.keys()]).toEqual(["a", "b"]);
    expect([...params.values()]).toEqual(["2", "3"]);

    const seen: string[] = [];
    params.forEach((value, key, parent) => {
      seen.push(`${key}=${value}`);
      expect(parent).toBe(params);
    });

    expect(seen).toEqual(["a=2", "b=3"]);

    params.delete("a");

    expect(params.has("a")).toBe(false);
    expect(params.size).toBe(1);
  });
});
