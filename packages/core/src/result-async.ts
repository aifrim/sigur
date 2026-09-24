import { toError } from "./errors.ts";
import { Err, Ok, type Result } from "./result.ts";

/**
 * Async wrapper that settles to a {@link Result}.
 *
 * Thenable: `await` yields a `Result`, then extract value / error or return upstream.
 *
 * @example
 * ```ts
 * import { sure } from "@sigurjs/core";
 *
 * const sureFn = sure(fn);
 * const result = await sureFn();
 *
 * if (result.isOkay()) {
 *   console.log(result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export class ResultAsync<T, E = Error> implements PromiseLike<Result<T, E>> {
  readonly #promise: Promise<Result<T, E>>;

  constructor(promise: Promise<Result<T, E>>) {
    this.#promise = promise;
  }

  /**
   * Capture a Promise as `ResultAsync`.
   * Fulfillment → `Ok`; rejection → `Err` via {@link toError}.
   *
   * @example
   * ```ts
   * const okResult = await ResultAsync.fromPromise(Promise.resolve(10));
   * const errResult = await ResultAsync.fromPromise(Promise.reject(new Error("no")));
   *
   * if (okResult.isOkay()) {
   *   console.log(okResult.value);
   * }
   *
   * if (errResult.isErr()) {
   *   console.error(errResult.error);
   * }
   * ```
   */
  static fromPromise<T>(promise: Promise<T>): ResultAsync<T, Error> {
    return new ResultAsync(
      promise.then(
        (value) => Ok(value),
        (cause) => Err(toError(cause)),
      ),
    );
  }

  /**
   * {@link PromiseLike} implementation — makes `await resultAsync` work.
   *
   * Fulfillment receives a {@link Result} (not `T` directly). Rejection is rare:
   * construction paths normally catch causes into `ErrResult`; `onrejected` is only
   * for unexpected promise failures after that.
   *
   * Prefer `const result = await resultAsync` then `isOkay` / `isErr`.
   */
  // biome-ignore lint/suspicious/noThenProperty: ResultAsync is intentionally thenable
  then<TResult1 = Result<T, E>, TResult2 = never>(
    onfulfilled?: ((value: Result<T, E>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.#promise.then(onfulfilled, onrejected);
  }
}
