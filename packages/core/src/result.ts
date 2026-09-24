/**
 * Sync success or failure — abstract runtime root for {@link OkResult} / {@link ErrResult}.
 * Async counterpart: {@link ResultAsync}.
 *
 * Use a `Result` for exactly one of:
 * 1. **Extract the value** — `isOkay()` then `.value`
 * 2. **Extract the error** — `isNotOkay()` then `.error`
 * 3. **Return it upstream** — `return result`
 *
 * Prefer positive checks (`isOkay` / `isNotOkay` with the matching branch) so TypeScript
 * narrows to {@link OkResult} / {@link ErrResult}; the false branch of a type predicate
 * does not narrow the abstract {@link Result} class.
 *
 * Create values with {@link sure}, {@link Ok}, and {@link Err}.
 * Type against `Result`; use `instanceof Result` / `OkResult` / `ErrResult` at runtime.
 *
 * @typeParam T - Success value
 * @typeParam E - Error value (defaults to `Error`)
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
 * import { Ok, type Result } from "@sigur/core";
 *
 * function use(result: Result<string, Error>): Result<string, Error> {
 *   if (result.isOkay()) {
 *     return Ok(result.value.toUpperCase());
 *   }
 *
 *   return result; // upstream
 * }
 * ```
 */
export abstract class Result<T, E = Error> {
  abstract readonly ok: boolean;

  abstract isOkay(): this is OkResult<T, E>;

  abstract isNotOkay(): this is ErrResult<T, E>;
}

/**
 * Successful {@link Result} — extract {@link OkResult.value} after {@link isOkay},
 * or return the `Result` upstream. Construct with {@link Ok}.
 */
export class OkResult<T, E = never> extends Result<T, E> {
  readonly ok: true = true as const;
  readonly value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  isOkay(): this is OkResult<T, E> {
    return true;
  }

  isNotOkay(): this is ErrResult<T, E> {
    return false;
  }
}

/**
 * Failed {@link Result} — extract {@link ErrResult.error} after {@link isNotOkay},
 * or return the `Result` upstream. Construct with {@link Err}.
 */
export class ErrResult<T = never, E = Error> extends Result<T, E> {
  readonly ok: false = false as const;
  readonly error: E;

  constructor(error: E) {
    super();
    this.error = error;
  }

  isOkay(): this is OkResult<T, E> {
    return false;
  }

  isNotOkay(): this is ErrResult<T, E> {
    return true;
  }
}

/**
 * Create an okay {@link Result}.
 *
 * @example
 * ```ts
 * import { Ok } from "@sigur/core";
 *
 * const result = Ok(42);
 *
 * if (result.isOkay()) {
 *   console.log(result.value);
 * }
 * ```
 */
export function Ok<T, E = never>(value: T): Result<T, E> {
  return new OkResult(value);
}

/**
 * Create a not-okay {@link Result}.
 *
 * Accepts an {@link Error}, any other error value, or a message string (with optional
 * `Error` constructor options — same shape as `new Error(message, options)`).
 *
 * @example
 * ```ts
 * import { Err } from "@sigur/core";
 *
 * Err(new Error("nope"));
 * Err("nope");
 * Err("nope", { cause: previous });
 * Err(new TypeError("bad"), { cause: previous });
 * ```
 */
export function Err(message: string, options?: ErrorOptions): Result<never, Error>;
export function Err<E extends Error>(error: E, options?: ErrorOptions): Result<never, Error>;
export function Err<T = never, E = Error>(error: E): Result<T, E>;
export function Err(error: unknown, options?: ErrorOptions): Result<never, unknown> {
  if (typeof error === "string") {
    return new ErrResult(new Error(error, options));
  }

  if (error instanceof Error && options !== undefined) {
    const Ctor = error.constructor as new (message?: string, options?: ErrorOptions) => Error;

    try {
      return new ErrResult(new Ctor(error.message, options));
    } catch {
      return new ErrResult(new Error(error.message, { ...options, cause: options.cause ?? error }));
    }
  }

  return new ErrResult(error);
}
