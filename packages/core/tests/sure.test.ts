import { describe, expect, it, vi } from "vitest";
import type { Result } from "../src/result.ts";
import type { ResultAsync } from "../src/result-async.ts";
import { sure } from "../src/sure.ts";

describe("sure", () => {
  describe("errors", () => {
    describe("maps anything thrown from a sync fn", () => {
      it("keeps Error instances", () => {
        const err = new TypeError("typed");
        const sureFn = sure(() => {
          throw err;
        });

        const result = sureFn();

        if (result.isNotOkay()) {
          expect(result.error).toBe(err);
        } else {
          expect.unreachable();
        }
      });

      it("maps strings to Error messages", () => {
        const sureFn = sure(() => {
          throw "boom";
        });

        const result = sureFn();

        if (result.isNotOkay()) {
          expect(result.error).toBeInstanceOf(Error);
          expect(result.error.message).toBe("boom");
        } else {
          expect.unreachable();
        }
      });

      it("maps numbers to Unknown error with cause", () => {
        const sureFn = sure(() => {
          throw 42;
        });

        const result = sureFn();

        if (result.isNotOkay()) {
          expect(result.error).toBeInstanceOf(Error);
          expect(result.error.message).toBe("Unknown error");
          expect(result.error.cause).toBe(42);
        } else {
          expect.unreachable();
        }
      });

      it("maps objects to Unknown error with cause", () => {
        const payload = { code: "EFAIL" };
        const sureFn = sure(() => {
          throw payload;
        });

        const result = sureFn();

        if (result.isNotOkay()) {
          expect(result.error.message).toBe("Unknown error");
          expect(result.error.cause).toBe(payload);
        } else {
          expect.unreachable();
        }
      });
    });

    describe("maps anything thrown or rejected from an async fn", () => {
      it("keeps thrown Error instances", async () => {
        const err = new RangeError("range");
        const sureFn = sure(async () => {
          throw err;
        });

        const result = await sureFn();

        if (result.isNotOkay()) {
          expect(result.error).toBe(err);
        } else {
          expect.unreachable();
        }
      });

      it("maps thrown strings to Error messages", async () => {
        const sureFn = sure(async () => {
          throw "async boom";
        });

        const result = await sureFn();

        if (result.isNotOkay()) {
          expect(result.error.message).toBe("async boom");
        } else {
          expect.unreachable();
        }
      });

      it("maps thrown numbers to Unknown error with cause", async () => {
        const sureFn = sure(async () => {
          throw 7;
        });

        const result = await sureFn();

        if (result.isNotOkay()) {
          expect(result.error.message).toBe("Unknown error");
          expect(result.error.cause).toBe(7);
        } else {
          expect.unreachable();
        }
      });

      it("maps Promise.reject values the same way", async () => {
        const sureFn = sure(() => Promise.reject({ reason: "nope" }));

        const result = await sureFn();

        if (result.isNotOkay()) {
          expect(result.error.message).toBe("Unknown error");
          expect(result.error.cause).toEqual({ reason: "nope" });
        } else {
          expect.unreachable();
        }
      });
    });

    describe("maps anything thrown from finally", () => {
      it("maps sync finally non-Error throws into AggregateError via toError", () => {
        const sureFn = sure(
          () => {
            throw new Error("work");
          },
          {
            finally: () => {
              throw 99;
            },
          },
        );

        const result = sureFn();

        if (result.isNotOkay() && result.error instanceof AggregateError) {
          expect(result.error.errors).toHaveLength(2);
          expect(result.error.errors[0]).toBeInstanceOf(Error);
          expect(result.error.errors[0].message).toBe("work");
          expect(result.error.errors[1]).toBeInstanceOf(Error);
          expect(result.error.errors[1].message).toBe("Unknown error");
          expect(result.error.errors[1].cause).toBe(99);
        } else {
          expect.unreachable();
        }
      });

      it("maps sync finally string throws into AggregateError messages", () => {
        const sureFn = sure(
          () => {
            throw "work";
          },
          {
            finally: () => {
              throw "cleanup";
            },
          },
        );

        const result = sureFn();

        if (result.isNotOkay() && result.error instanceof AggregateError) {
          expect(result.error.errors).toHaveLength(2);
          expect(result.error.errors[0]).toBeInstanceOf(Error);
          expect(result.error.errors[0].message).toBe("work");
          expect(result.error.errors[1]).toBeInstanceOf(Error);
          expect(result.error.errors[1].message).toBe("cleanup");
        } else {
          expect.unreachable();
        }
      });

      it("maps async finally non-Error throws into AggregateError via toError", async () => {
        const sureFn = sure(
          async () => {
            throw new Error("work");
          },
          {
            finally: async () => {
              throw { cleanup: true };
            },
          },
        );

        const result = await sureFn();

        if (result.isNotOkay() && result.error instanceof AggregateError) {
          expect(result.error.errors).toHaveLength(2);
          expect(result.error.errors[0]).toBeInstanceOf(Error);
          expect(result.error.errors[0].message).toBe("work");
          expect(result.error.errors[1]).toBeInstanceOf(Error);
          expect(result.error.errors[1].message).toBe("Unknown error");
          expect(result.error.errors[1].cause).toEqual({ cleanup: true });
        } else {
          expect.unreachable();
        }
      });

      it("maps async finally string throws into AggregateError messages", async () => {
        const sureFn = sure(
          async () => {
            throw "work";
          },
          {
            finally: async () => {
              throw "cleanup";
            },
          },
        );

        const result = await sureFn();

        if (result.isNotOkay() && result.error instanceof AggregateError) {
          expect(result.error.errors).toHaveLength(2);
          expect(result.error.errors[0]).toBeInstanceOf(Error);
          expect(result.error.errors[0].message).toBe("work");
          expect(result.error.errors[1]).toBeInstanceOf(Error);
          expect(result.error.errors[1].message).toBe("cleanup");
        } else {
          expect.unreachable();
        }
      });
    });
  });

  describe("wrapping", () => {
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

    it("wraps sync void success as unit Ok()", () => {
      const sureFn = sure(() => {});
      const result: Result<void, Error> = sureFn();

      if (result.isOkay()) {
        expect(result.value).toBeUndefined();
      } else {
        expect.unreachable();
      }
    });

    it("wraps async void success as unit Ok()", async () => {
      const sureFn = sure(async () => {});
      const pending: ResultAsync<void, Error> = sureFn();
      const result = await pending;

      if (result.isOkay()) {
        expect(result.value).toBeUndefined();
      } else {
        expect.unreachable();
      }
    });

    it("runs finally on failure", () => {
      const cleanup = vi.fn();
      const fn = () => {
        throw "boom";
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

    it("does not run finally on async success", async () => {
      const cleanup = vi.fn();
      const fn = async () => 42;
      const sureFn = sure(fn, { finally: cleanup });

      const result = await sureFn();

      if (result.isOkay()) {
        expect(result.value).toBe(42);
      } else {
        expect.unreachable();
      }

      expect(cleanup).not.toHaveBeenCalled();
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
});
