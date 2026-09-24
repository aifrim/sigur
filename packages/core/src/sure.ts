import { combineErrors, toError } from "./errors.ts";
import { Err, Ok, type Result } from "./result.ts";
import { ResultAsync } from "./result-async.ts";

export { toError } from "./errors.ts";

/**
 * Options for {@link sure}.
 */
export type SureOptions = {
  /**
   * Runs after a failed attempt (each call to the wrapped function).
   * May return a Promise when wrapping an async function.
   * If the attempt already failed and this also throws → {@link AggregateError}.
   */
  finally?: () => void | Promise<void>;
};

/**
 * Run a sync thunk and map throw → {@link Err}.
 * Optional `onFail` runs only after failure (Sigur `finally`); if it also throws,
 * both causes become an {@link AggregateError}.
 */
function trySync<T>(fn: () => T, onFail?: () => void): Result<T, Error> {
  let result: Result<T, Error>;

  try {
    result = Ok(fn());
  } catch (cause: unknown) {
    result = Err(toError(cause));
  }

  if (onFail !== undefined && result.isNotOkay()) {
    try {
      onFail();
    } catch (cleanupCause: unknown) {
      return Err(combineErrors(result.error, toError(cleanupCause)));
    }
  }

  return result;
}

/**
 * Same control flow as {@link trySync}, but awaits `fn` / `onFail`.
 * Returns a plain `Promise<Result>` so {@link tryAsync} can wrap it once.
 */
async function settleAsync<T>(
  fn: () => PromiseLike<T> | T,
  onFail?: () => void | Promise<void>,
): Promise<Result<T, Error>> {
  let result: Result<T, Error>;

  try {
    result = Ok(await fn());
  } catch (cause: unknown) {
    result = Err(toError(cause));
  }

  if (onFail !== undefined && result.isNotOkay()) {
    try {
      await onFail();
    } catch (cleanupCause: unknown) {
      return Err(combineErrors(result.error, toError(cleanupCause)));
    }
  }

  return result;
}

/** Bridge: async settle → {@link ResultAsync} (thenable `Result`). */
function tryAsync<T>(
  fn: () => PromiseLike<T> | T,
  onFail?: () => void | Promise<void>,
): ResultAsync<T, Error> {
  return new ResultAsync(settleAsync(fn, onFail));
}

type AnyFn = (...args: never[]) => unknown;

/**
 * `true` when `T` is `any`.
 * Trick: `1 & any` collapses to `any`, and everything extends `any`, so
 * `0 extends 1 & T` holds only for `any` (not for `unknown`, unions, etc.).
 * Used by {@link SureReturn} so `any`-returning APIs (e.g. `JSON.parse`) stay sync.
 */
type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Infer sync {@link Result} vs {@link ResultAsync} from `fn`'s return type.
 * `never` (always-throw) and `any` (e.g. `JSON.parse`) stay on the sync path.
 */
type SureReturn<T> = [T] extends [never]
  ? Result<T, Error>
  : IsAny<T> extends true
    ? Result<T, Error>
    : [T] extends [PromiseLike<infer U>]
      ? ResultAsync<U, Error>
      : Result<T, Error>;

/**
 * Unsure function in → sure function out.
 *
 * Wraps a throwing / rejecting function so callers get a {@link Result}
 * (or {@link ResultAsync}) instead of exceptions. Causes are mapped with {@link toError}.
 *
 * @example
 * ```ts
 * import { sure } from "@sigur/core";
 *
 * const sureFn = sure(fn);
 * const result = sureFn();
 *
 * if (result.isOkay()) {
 *   console.log(result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 *
 * @example
 * ```ts
 * import { sure } from "@sigur/core";
 *
 * const sureFn = sure(fn, {
 *   finally: () => cleanup(),
 * });
 * const result = sureFn();
 *
 * // `finally` runs after a failed attempt; if cleanup also throws → AggregateError
 * ```
 */
export function sure<A extends readonly unknown[], T>(
  fn: (...args: A) => T,
  options?: SureOptions,
): (...args: A) => SureReturn<T>;
export function sure(
  fn: AnyFn,
  options?: SureOptions,
): (...args: never[]) => Result<unknown, Error> | ResultAsync<unknown, Error> {
  const onFail = options?.finally;

  return (...args: never[]): Result<unknown, Error> | ResultAsync<unknown, Error> => {
    // Always invoke sync first: calling `fn` may throw before any Promise exists,
    // or return a thenable. Sync `finally` must not return a Promise (use async `fn`).
    const outcome = trySync(
      () => fn(...args),
      onFail !== undefined
        ? () => {
            const cleanup = onFail();
            if (isPromiseLike(cleanup)) {
              throw new TypeError("sure(): async finally requires an async function");
            }
          }
        : undefined,
    );

    if (outcome.isOkay()) {
      // Success that is a Promise → await it on the async path (rejections → Err).
      if (isPromiseLike(outcome.value)) {
        return tryAsync(() => outcome.value, onFail);
      }

      return outcome;
    }

    // Sync throw already became Err (and sync finally already ran if present).
    return outcome;
  };
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as { then: unknown }).then === "function"
  );
}
