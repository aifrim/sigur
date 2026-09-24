/**
 * Normalize any thrown / rejected cause to an {@link Error}.
 * Existing `Error` instances (including `AggregateError`) are kept as-is.
 *
 * @example
 * ```ts
 * import { toError } from "@sigur/core";
 *
 * toError(new TypeError("x")); // same TypeError
 * toError("boom"); // Error("boom")
 * toError(42); // Error("Unknown error", { cause: 42 })
 * ```
 */
export function toError(cause: unknown): Error {
  if (cause instanceof Error) {
    return cause;
  }

  if (typeof cause === "string") {
    return new Error(cause);
  }

  return new Error("Unknown error", { cause });
}

/**
 * Prefer AggregateError so cleanup cannot hide the original failure.
 *
 * @example
 * ```ts
 * const aggregated = combineErrors(
 *   new Error("work failed"),
 *   new Error("cleanup failed"),
 * );
 * // AggregateError with both causes
 * ```
 */
export function combineErrors(primary: unknown, cleanup: unknown): AggregateError {
  return new AggregateError([primary, cleanup], "Operation failed and cleanup also threw");
}
