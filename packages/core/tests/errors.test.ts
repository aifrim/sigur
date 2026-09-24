import { describe, expect, it } from "vitest";
import { toError } from "../src/index.ts";

describe("toError", () => {
  it("keeps Error instances as-is", () => {
    const boom = new Error("boom");
    expect(toError(boom)).toBe(boom);

    const aggregate = new AggregateError([new Error("a")], "many");
    expect(toError(aggregate)).toBe(aggregate);
  });

  it("keeps custom Error subclasses as-is", () => {
    class AppError extends Error {
      readonly code: string;

      constructor(message: string, code: string) {
        super(message);
        this.name = "AppError";
        this.code = code;
      }
    }

    const custom = new AppError("failed", "E_APP");
    const result = toError(custom);

    expect(result).toBe(custom);
    expect(result).toBeInstanceOf(Error);
    expect(result).toBeInstanceOf(AppError);

    if (result instanceof AppError) {
      expect(result.code).toBe("E_APP");
    } else {
      expect.unreachable();
    }
  });

  it("wraps strings as Error messages", () => {
    const error = toError("nope");

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("nope");
  });

  it("wraps other causes as Unknown error", () => {
    const fromNumber = toError(42);
    expect(fromNumber.message).toBe("Unknown error");
    expect(fromNumber.cause).toBe(42);

    const fromNull = toError(null);
    expect(fromNull.message).toBe("Unknown error");
    expect(fromNull.cause).toBeNull();

    const fromObject = toError({ code: "EFAIL" });
    expect(fromObject.message).toBe("Unknown error");
    expect(fromObject.cause).toEqual({ code: "EFAIL" });
  });
});
