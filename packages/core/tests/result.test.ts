import { describe, expect, it } from "vitest";
import { Err, Ok, OkResult, Result } from "../src/result.ts";

describe("Result", () => {
  it("constructs okay and not-okay results", () => {
    const success = Ok(42);
    const failure = Err("boom");

    expect(success).toBeInstanceOf(Result);
    expect(failure).toBeInstanceOf(Result);

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
    const result: Result<number, Error> = Err("nope");

    if (result.isNotOkay()) {
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe("nope");
    } else {
      expect.unreachable();
    }
  });

  it("accepts Error constructor options on a message string", () => {
    const cause = new TypeError("root");
    const result = Err("wrapped", { cause });

    if (result.isNotOkay()) {
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe("wrapped");
      expect(result.error.cause).toBe(cause);
    } else {
      expect.unreachable();
    }
  });

  it("accepts Error constructor options on an Error instance", () => {
    const cause = new Error("root");
    const result = Err(new TypeError("bad"), { cause });

    if (result.isNotOkay()) {
      expect(result.error).toBeInstanceOf(TypeError);
      expect(result.error.message).toBe("bad");
      expect(result.error.cause).toBe(cause);
    } else {
      expect.unreachable();
    }
  });

  it("returns the result upstream", () => {
    const read = (): Result<string, Error> => Err("missing");

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

  it("Ok() is a void unit success", () => {
    const result: Result<void, never> = Ok();
    const asErrorE: Result<void, Error> = Ok();

    expect(asErrorE.isOkay()).toBe(true);

    if (result.isOkay()) {
      expect(result.value).toBeUndefined();
    } else {
      expect.unreachable();
    }
  });

  it("Ok(undefined) keeps an explicit undefined payload", () => {
    const result: Result<undefined, never> = Ok(undefined);

    if (result.isOkay()) {
      expect(result.value).toBeUndefined();
    } else {
      expect.unreachable();
    }
  });
});
