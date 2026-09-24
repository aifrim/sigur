import { describe, expect, it, vi } from "vitest";
import { sure } from "../src/index.ts";

describe("sure", () => {
  it("wraps sync success", () => {
    const fn = () => 1;
    const sureFn = sure(fn);

    const result = sureFn();

    if (result.isOkay()) {
      expect(result.value).toBe(1);
    } else {
      expect.unreachable();
    }
  });

  it("wraps sync failure", () => {
    const fn = () => {
      throw new Error("boom");
    };
    const sureFn = sure(fn);

    const result = sureFn();

    if (result.isNotOkay()) {
      expect(result.error.message).toBe("boom");
    } else {
      expect.unreachable();
    }
  });

  it("runs finally on failure and auto-maps thrown errors", () => {
    const cleanup = vi.fn();
    const fn = () => {
      throw new Error("boom");
    };
    const sureFn = sure(fn, { finally: cleanup });

    const result = sureFn();

    if (result.isNotOkay()) {
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe("boom");
    } else {
      expect.unreachable();
    }

    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("auto-maps non-Error throws", () => {
    const fn = () => {
      throw "raw";
    };
    const sureFn = sure(fn);

    const result = sureFn();

    if (result.isNotOkay()) {
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe("raw");
    } else {
      expect.unreachable();
    }
  });

  it("returns AggregateError when work and cleanup both fail", () => {
    const fn = () => {
      throw new Error("work");
    };
    const sureFn = sure(fn, {
      finally: () => {
        throw new Error("cleanup");
      },
    });

    const result = sureFn();

    if (result.isNotOkay()) {
      if (result.error instanceof AggregateError) {
        expect(result.error.errors).toHaveLength(2);
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("wraps async success without running finally", async () => {
    const cleanup = vi.fn();
    const fn = async () => 5;
    const sureFn = sure(fn, { finally: cleanup });

    const result = await sureFn();

    if (result.isOkay()) {
      expect(result.value).toBe(5);
    } else {
      expect.unreachable();
    }

    expect(cleanup).not.toHaveBeenCalled();
  });

  it("wraps async rejection", async () => {
    const fn = async () => {
      throw new Error("async boom");
    };
    const sureFn = sure(fn);

    const result = await sureFn();

    if (result.isNotOkay()) {
      expect(result.error.message).toBe("async boom");
    } else {
      expect.unreachable();
    }
  });

  it("returns AggregateError for async work + cleanup failures", async () => {
    const fn = async () => {
      throw new Error("work");
    };
    const sureFn = sure(fn, {
      finally: async () => {
        throw new Error("cleanup");
      },
    });

    const result = await sureFn();

    if (result.isNotOkay()) {
      if (result.error instanceof AggregateError) {
        expect(result.error.errors).toHaveLength(2);
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("wraps a throwing sync function into a Result-returning one", () => {
    const fn = JSON.parse;
    const sureFn = sure(fn);

    const good = sureFn('{"a":1}');
    if (good.isOkay()) {
      expect(good.value).toEqual({ a: 1 });
    } else {
      expect.unreachable();
    }

    const bad = sureFn("{");
    if (bad.isNotOkay()) {
      expect(bad.error).toBeInstanceOf(Error);
    } else {
      expect.unreachable();
    }
  });

  it("wraps an async function into ResultAsync", async () => {
    const fn = async (path: string) => {
      if (path === "missing") {
        throw new Error("ENOENT");
      }
      return `data:${path}`;
    };
    const sureFn = sure(fn);

    const okResult = await sureFn("file.txt");
    if (okResult.isOkay()) {
      expect(okResult.value).toBe("data:file.txt");
    } else {
      expect.unreachable();
    }

    const fail = await sureFn("missing");
    if (fail.isNotOkay()) {
      expect(fail.error.message).toBe("ENOENT");
    } else {
      expect.unreachable();
    }
  });

  it("preserves parameter types for multi-arg functions", () => {
    const fn = (a: number, b: number) => a + b;
    const sureFn = sure(fn);

    const result = sureFn(2, 3);

    if (result.isOkay()) {
      expect(result.value).toBe(5);
    } else {
      expect.unreachable();
    }
  });

  it("preserves parameter types for multi-arg async functions", async () => {
    const fn = async (a: number, b: number) => a + b;
    const sureFn = sure(fn);

    const result = await sureFn(2, 3);

    if (result.isOkay()) {
      expect(result.value).toBe(5);
    } else {
      expect.unreachable();
    }
  });
});
