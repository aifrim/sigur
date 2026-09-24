import { describe, expect, it } from "vitest";
import { combineErrors, toError } from "../src/errors.ts";

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

  it("wraps other causes as Unknown error with cause", () => {
    const fromNumber = toError(42);
    expect(fromNumber.message).toBe("Unknown error");
    expect(fromNumber.cause).toBe(42);

    const fromNull = toError(null);
    expect(fromNull.message).toBe("Unknown error");
    expect(fromNull.cause).toBeNull();

    const fromObject = toError({ code: "EFAIL" });
    expect(fromObject.message).toBe("Unknown error");
    expect(fromObject.cause).toEqual({ code: "EFAIL" });

    const fromUndefined = toError(undefined);
    expect(fromUndefined.message).toBe("Unknown error");
    expect(fromUndefined.cause).toBeUndefined();

    const fromBoolean = toError(false);
    expect(fromBoolean.message).toBe("Unknown error");
    expect(fromBoolean.cause).toBe(false);
  });
});

describe("combineErrors", () => {
  it("aggregates two Errors without remapping", () => {
    const primary = new Error("work");
    const cleanup = new Error("cleanup");
    const aggregated = combineErrors(primary, cleanup);

    expect(aggregated).toBeInstanceOf(AggregateError);
    expect(aggregated.errors).toHaveLength(2);
    expect(aggregated.errors[0]).toBe(primary);
    expect(aggregated.errors[1]).toBe(cleanup);
  });

  it("keeps a cleanup Error produced by toError", () => {
    const primary = new Error("work");
    const cleanup = toError(99);
    const aggregated = combineErrors(primary, cleanup);

    expect(aggregated.errors).toHaveLength(2);
    expect(aggregated.errors[0]).toBe(primary);
    expect(aggregated.errors[1]).toBe(cleanup);
    expect(aggregated.errors[1].message).toBe("Unknown error");
    expect(aggregated.errors[1].cause).toBe(99);
  });
});
