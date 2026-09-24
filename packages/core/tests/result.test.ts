import { describe, expect, it } from "vitest";
import { Err, Ok, OkResult, Result } from "../src/index.ts";

describe("Result", () => {
  it("constructs okay and not-okay results", () => {
    const success = Ok(42);
    const failure = Err(new Error("boom"));

    expect(success).toBeInstanceOf(Result);
    expect(failure).toBeInstanceOf(Result);
    expect(success.ok).toBe(true);
    expect(failure.ok).toBe(false);

    if (success.isOkay()) {
      expect(success).toBeInstanceOf(OkResult);
      expect(success.value).toBe(42);
    } else {
      expect.unreachable();
    }

    if (failure.isNotOkay()) {
      expect(failure.error.message).toBe("boom");
    } else {
      expect.unreachable();
    }
  });

  it("extracts the value after isOkay", () => {
    const result: Result<number, string> = Ok(1);

    if (result.isOkay()) {
      expect(result.value).toBe(1);
    } else {
      expect.unreachable();
    }
  });

  it("extracts the error after isNotOkay", () => {
    const result: Result<number, string> = Err("nope");

    if (result.isNotOkay()) {
      expect(result.error).toBe("nope");
    } else {
      expect.unreachable();
    }
  });

  it("returns the result upstream", () => {
    const read = (): Result<string, Error> => Err(new Error("missing"));

    const load = (): Result<string, Error> => {
      const file = read();
      if (file.isOkay()) {
        return Ok(file.value.toUpperCase());
      }
      return file;
    };

    const result = load();

    if (result.isNotOkay()) {
      expect(result.error.message).toBe("missing");
    } else {
      expect.unreachable();
    }
  });
});
