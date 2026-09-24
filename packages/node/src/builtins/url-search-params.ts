import { Err, Ok, type Result, sure } from "@sigur/core";
import { registerInner, unwrap } from "./inner.ts";

type ConstructInit = string | Record<string, string> | string[][];

type URLSearchParamsInit = ConstructInit | globalThis.URLSearchParams | URLSearchParams;

/** `new globalThis.URLSearchParams(...)` as a `Result` — used by {@link URLSearchParams.from}. */
const createNative = sure((init?: ConstructInit) =>
  init === undefined ? new globalThis.URLSearchParams() : new globalThis.URLSearchParams(init),
);

/**
 * Live-wrap a native {@link globalThis.URLSearchParams} (same object; no clone).
 * Used by {@link URL.searchParams}; not part of the public barrel.
 */
export function wrapURLSearchParams(native: globalThis.URLSearchParams): URLSearchParams {
  return URLSearchParams.fromNative(native);
}

/**
 * Wrapper around {@link globalThis.URLSearchParams} (MDN surface; Node >= 22).
 *
 * **Why wrap:** `new globalThis.URLSearchParams(...)` can throw `TypeError` on
 * invalid init. Construct only via {@link URLSearchParams.from} (`new` on this
 * class cannot return a `Result`). Mutators that throw natively keep throwing.
 */
export class URLSearchParams {
  readonly #inner: globalThis.URLSearchParams;

  private constructor(inner: globalThis.URLSearchParams) {
    this.#inner = inner;
    registerInner(this, inner); // see inner.ts
  }

  /** @internal Live-wrap; same native object. Prefer {@link wrapURLSearchParams}. */
  static fromNative(native: globalThis.URLSearchParams): URLSearchParams {
    return new URLSearchParams(native);
  }

  /** Like `new globalThis.URLSearchParams(...)`, but returns a `Result` instead of throwing. */
  static from(init?: URLSearchParamsInit): Result<URLSearchParams, Error> {
    // Native ctor copies another URLSearchParams — live-wrap existing instances instead.
    if (init instanceof URLSearchParams) {
      return Ok(new URLSearchParams(unwrap<globalThis.URLSearchParams>(init)));
    }

    if (init instanceof globalThis.URLSearchParams) {
      return Ok(new URLSearchParams(init));
    }

    const native = createNative(init);

    if (native.isOkay()) {
      return Ok(new URLSearchParams(native.value));
    }

    if (native.isNotOkay()) {
      return Err(native.error);
    }

    return Err(new TypeError("unreachable"));
  }

  get size(): number {
    return this.#inner.size;
  }

  append(name: string, value: string): void {
    this.#inner.append(name, value);
  }

  delete(name: string, value?: string): void {
    if (value === undefined) {
      this.#inner.delete(name);
    } else {
      this.#inner.delete(name, value);
    }
  }

  get(name: string): string | null {
    return this.#inner.get(name);
  }

  getAll(name: string): string[] {
    return this.#inner.getAll(name);
  }

  has(name: string, value?: string): boolean {
    return value === undefined ? this.#inner.has(name) : this.#inner.has(name, value);
  }

  set(name: string, value: string): void {
    this.#inner.set(name, value);
  }

  sort(): void {
    this.#inner.sort();
  }

  toString(): string {
    return this.#inner.toString();
  }

  keys(): IterableIterator<string> {
    return this.#inner.keys();
  }

  values(): IterableIterator<string> {
    return this.#inner.values();
  }

  entries(): IterableIterator<[string, string]> {
    return this.#inner.entries();
  }

  forEach(
    callbackfn: (value: string, key: string, parent: URLSearchParams) => void,
    thisArg?: unknown,
  ): void {
    this.#inner.forEach((value, key) => {
      callbackfn.call(thisArg, value, key, this);
    });
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.#inner[Symbol.iterator]();
  }
}
