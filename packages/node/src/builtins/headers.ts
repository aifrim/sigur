import { Err, Ok, type Result, sure } from "@sigur/core";
import { registerInner, unwrap } from "./inner.ts";

type HeadersInput = HeadersInit | Headers;

function toNativeInit(init?: HeadersInput): HeadersInit | undefined {
  if (init === undefined) {
    return undefined;
  }

  return init instanceof Headers ? unwrap<globalThis.Headers>(init) : init;
}

/** `new globalThis.Headers(...)` as a `Result` — used by {@link Headers.from}. */
const createNative = sure((init?: HeadersInit) =>
  init === undefined ? new globalThis.Headers() : new globalThis.Headers(init),
);

/**
 * Live-wrap a known-good native {@link globalThis.Headers} (same object; no clone).
 * Used when the native list must keep its guard (e.g. immutable response headers).
 */
export function wrapHeaders(native: globalThis.Headers): Headers {
  return Headers.wrap(native);
}

/**
 * Wrapper around {@link globalThis.Headers} (MDN Headers surface; Node >= 22).
 *
 * **Why wrap:** `new globalThis.Headers(init)` throws `TypeError` on invalid
 * names/values or bad init shapes. Construct only via {@link Headers.from}
 * (`new` on this class cannot return a `Result`).
 *
 * Mutators (`append` / `set` / `delete`) throw like native — including on
 * immutable guard Headers — and are not wrapped in `Result`.
 */
export class Headers {
  readonly #inner: globalThis.Headers;

  private constructor(inner: globalThis.Headers) {
    this.#inner = inner;
    registerInner(this, inner); // see inner.ts
  }

  /** @internal Live-wrap; same native object. Prefer {@link wrapHeaders}. */
  static wrap(native: globalThis.Headers): Headers {
    return new Headers(native);
  }

  /** Like `new globalThis.Headers(...)`, but returns a `Result` instead of throwing. */
  static from(init?: HeadersInput): Result<Headers, Error> {
    const native = createNative(toNativeInit(init));

    if (native.isOkay()) {
      return Ok(new Headers(native.value));
    }

    if (native.isNotOkay()) {
      return Err(native.error);
    }

    return Err(new TypeError("unreachable"));
  }

  append(name: string, value: string): void {
    this.#inner.append(name, value);
  }

  delete(name: string): void {
    this.#inner.delete(name);
  }

  get(name: string): string | null {
    return this.#inner.get(name);
  }

  getSetCookie(): string[] {
    return this.#inner.getSetCookie();
  }

  has(name: string): boolean {
    return this.#inner.has(name);
  }

  set(name: string, value: string): void {
    this.#inner.set(name, value);
  }

  keys(): HeadersIterator<string> {
    return this.#inner.keys();
  }

  values(): HeadersIterator<string> {
    return this.#inner.values();
  }

  entries(): HeadersIterator<[string, string]> {
    return this.#inner.entries();
  }

  forEach(
    callbackfn: (value: string, key: string, parent: Headers) => void,
    thisArg?: unknown,
  ): void {
    this.#inner.forEach((value, key) => {
      callbackfn.call(thisArg, value, key, this);
    });
  }

  [Symbol.iterator](): HeadersIterator<[string, string]> {
    return this.#inner[Symbol.iterator]();
  }
}
