import { describe, expect, it } from "vitest";
import { Ok, type Result } from "../src/result.ts";
import { ResultAsync } from "../src/result-async.ts";

describe("ResultAsync", () => {
  it("awaits to a Result for extracting value or error", async () => {
    const success = await ResultAsync.fromPromise(Promise.resolve(10));

    if (success.isOkay()) {
      expect(success.value).toBe(10);
    } else {
      expect.unreachable();
    }

    const failure = await ResultAsync.fromPromise(Promise.reject(new Error("no")));

    if (failure.isErr()) {
      expect(failure.error).toBeInstanceOf(Error);
      expect(failure.error.message).toBe("no");
    } else {
      expect.unreachable();
    }
  });

  it("fromPromise maps void fulfillment to unit Ok()", async () => {
    const result: Result<void, Error> = await ResultAsync.fromPromise(Promise.resolve());

    if (result.isOkay()) {
      expect(result.value).toBeUndefined();
    } else {
      expect.unreachable();
    }
  });

  it("can be returned upstream after await", async () => {
    const read = (): ResultAsync<string, Error> =>
      ResultAsync.fromPromise(Promise.reject(new Error("missing")));

    const load = async (): Promise<Result<string, Error>> => {
      const file = await read();
      if (file.isOkay()) {
        return Ok(file.value.toUpperCase());
      }
      return file;
    };

    const result = await load();

    if (result.isErr()) {
      expect(result.error.message).toBe("missing");
    } else {
      expect.unreachable();
    }
  });
});
