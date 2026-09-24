import { describe, expect, it } from "vitest";
import { Headers } from "../src/builtins/headers.ts";
import { unwrap } from "../src/builtins/inner.ts";
import { Response } from "../src/builtins/response.ts";

describe("Headers", () => {
  it("from() constructs empty headers", () => {
    const result = Headers.from();

    if (result.isOkay()) {
      expect(result.value).toBeInstanceOf(Headers);
      expect(unwrap<globalThis.Headers>(result.value)).toBeInstanceOf(globalThis.Headers);
      expect(result.value.get("x-missing")).toBeNull();
    } else {
      expect.unreachable();
    }
  });

  it("from({}) constructs empty headers", () => {
    const result = Headers.from({});

    if (result.isOkay()) {
      expect(unwrap<globalThis.Headers>(result.value)).toBeInstanceOf(globalThis.Headers);
      expect([...result.value.entries()]).toEqual([]);
    } else {
      expect.unreachable();
    }
  });

  it("from([[name, value]]) constructs and get matches", () => {
    const result = Headers.from([["content-type", "text/plain"]]);

    if (result.isOkay()) {
      expect(result.value.get("content-type")).toBe("text/plain");
      expect(unwrap<globalThis.Headers>(result.value)).toBeInstanceOf(globalThis.Headers);
    } else {
      expect.unreachable();
    }
  });

  it("from(record) constructs and get matches", () => {
    const result = Headers.from({ accept: "application/json", "x-custom": "1" });

    if (result.isOkay()) {
      expect(result.value.get("accept")).toBe("application/json");
      expect(result.value.get("x-custom")).toBe("1");
    } else {
      expect.unreachable();
    }
  });

  it("from(native Headers) constructs and get matches", () => {
    const native = new globalThis.Headers({ "x-from-native": "yes" });
    const result = Headers.from(native);

    if (result.isOkay()) {
      expect(result.value.get("x-from-native")).toBe("yes");
      expect(unwrap<globalThis.Headers>(result.value)).toBeInstanceOf(globalThis.Headers);
    } else {
      expect.unreachable();
    }
  });

  it("from(wrapper) copies via unwrap", () => {
    const first = Headers.from({ "x-round-trip": "ok" });

    if (first.isOkay()) {
      const second = Headers.from(first.value);

      if (second.isOkay()) {
        expect(second.value.get("x-round-trip")).toBe("ok");
        expect(unwrap<globalThis.Headers>(second.value)).not.toBe(
          unwrap<globalThis.Headers>(first.value),
        );
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("from returns err for invalid init", () => {
    const result = Headers.from([["Invalid Name!", "value"]]);

    if (result.isNotOkay()) {
      expect(result.error).toBeInstanceOf(TypeError);
    } else {
      expect.unreachable();
    }
  });

  it("append, set, delete, has, and get behave like native", () => {
    const result = Headers.from();

    if (result.isOkay()) {
      const headers = result.value;

      headers.append("x-a", "1");
      headers.append("x-a", "2");
      expect(headers.get("x-a")).toBe("1, 2");
      expect(headers.has("x-a")).toBe(true);

      headers.set("x-a", "only");
      expect(headers.get("x-a")).toBe("only");

      headers.delete("x-a");
      expect(headers.has("x-a")).toBe(false);
      expect(headers.get("x-a")).toBeNull();
    } else {
      expect.unreachable();
    }
  });

  it("getSetCookie returns set-cookie values", () => {
    const result = Headers.from();

    if (result.isOkay()) {
      const headers = result.value;

      headers.append("set-cookie", "a=1");
      headers.append("set-cookie", "b=2");

      expect(headers.getSetCookie()).toEqual(["a=1", "b=2"]);
    } else {
      expect.unreachable();
    }
  });

  it("append with an invalid header name still throws", () => {
    const result = Headers.from();

    if (result.isOkay()) {
      expect(() => {
        result.value.append("Invalid Name!", "value");
      }).toThrow(TypeError);
    } else {
      expect.unreachable();
    }
  });

  it("set with an invalid header value still throws", () => {
    const result = Headers.from();

    if (result.isOkay()) {
      expect(() => {
        result.value.set("x-bad", "no\nnewline");
      }).toThrow(TypeError);
    } else {
      expect.unreachable();
    }
  });

  it("mutators throw when the underlying Headers is immutable", () => {
    const errorResponse = Response.error();

    if (!errorResponse.isOkay()) {
      expect.unreachable();
      return;
    }

    const headers = errorResponse.value.headers;

    expect(headers).toBeInstanceOf(Headers);

    expect(() => {
      headers.set("x-test", "1");
    }).toThrow(TypeError);

    expect(() => {
      headers.append("x-test", "1");
    }).toThrow(TypeError);
  });

  it("entries, forEach, and for…of cover stored pairs", () => {
    const result = Headers.from([
      ["accept", "text/html"],
      ["x-test", "1"],
    ]);

    if (result.isOkay()) {
      const headers = result.value;
      const fromEntries = [...headers.entries()];

      expect(fromEntries).toEqual([
        ["accept", "text/html"],
        ["x-test", "1"],
      ]);

      const fromForOf: [string, string][] = [];
      for (const pair of headers) {
        fromForOf.push(pair);
      }
      expect(fromForOf).toEqual(fromEntries);

      const fromForEach: [string, string][] = [];
      headers.forEach((value, key, parent) => {
        expect(parent).toBe(headers);
        fromForEach.push([key, value]);
      });
      expect(fromForEach).toEqual(fromEntries);
    } else {
      expect.unreachable();
    }
  });
});
