import { Err, Ok, type Result, sure } from "@sigurjs/core";
import { registerInner, unwrap } from "./inner.ts";
import { type URLSearchParams, wrapURLSearchParams } from "./url-search-params.ts";

type UrlInput = string | globalThis.URL | URL;

function toNativeInput(input: UrlInput): string | globalThis.URL {
  return input instanceof URL ? unwrap<globalThis.URL>(input) : input;
}

/** `new globalThis.URL(...)` as a `Result` — used by {@link URL.from}. */
const createNative = sure((input: string | globalThis.URL, base?: string | globalThis.URL) =>
  base === undefined ? new globalThis.URL(input) : new globalThis.URL(input, base),
);

/**
 * Wrapper around {@link globalThis.URL} (MDN URL surface; Node >= 22).
 *
 * **Why wrap:** `new globalThis.URL(...)` throws `TypeError` on invalid input.
 * Native `URL.parse` returns `null` instead of throwing — both are awkward in
 * Result-oriented code. Construct only via {@link URL.from} / {@link URL.parse}
 * (`new` on this class cannot return a `Result`).
 *
 * Instance properties match the native API (writable where MDN allows). Setters
 * throw like native. {@link URL.createObjectURL} returns a `Result`.
 */
export class URL {
  readonly #inner: globalThis.URL;

  private constructor(inner: globalThis.URL) {
    this.#inner = inner;
    registerInner(this, inner); // see inner.ts
  }

  /** Like `new globalThis.URL(...)`, but returns a `Result` instead of throwing. */
  static from(input: UrlInput, base?: UrlInput): Result<URL, Error> {
    const native = createNative(
      toNativeInput(input),
      base === undefined ? undefined : toNativeInput(base),
    );

    if (native.isOkay()) {
      return Ok(new URL(native.value));
    }

    if (native.isErr()) {
      return Err(native.error);
    }

    return Err(new TypeError("unreachable"));
  }

  /**
   * Wrap {@link globalThis.URL.parse} (Node >= 22).
   * `null` → `Err(TypeError("Invalid URL"))`.
   */
  static parse(input: UrlInput, base?: UrlInput): Result<URL, Error> {
    const parsed =
      base === undefined
        ? globalThis.URL.parse(toNativeInput(input))
        : globalThis.URL.parse(toNativeInput(input), toNativeInput(base));

    if (parsed === null) {
      return Err(new TypeError("Invalid URL"));
    }

    return Ok(new URL(parsed));
  }

  /** Whether `input` (+ optional `base`) would parse as a valid URL. */
  static canParse(input: UrlInput, base?: UrlInput): boolean {
    return base === undefined
      ? globalThis.URL.canParse(toNativeInput(input))
      : globalThis.URL.canParse(toNativeInput(input), toNativeInput(base));
  }

  /**
   * {@link globalThis.URL.createObjectURL} as a `Result`
   * (throws on unsupported object types).
   */
  static createObjectURL = sure(globalThis.URL.createObjectURL);

  /** {@link globalThis.URL.revokeObjectURL}. */
  static revokeObjectURL(url: string): void {
    globalThis.URL.revokeObjectURL(url);
  }

  get href(): string {
    return this.#inner.href;
  }

  set href(value: string) {
    this.#inner.href = value;
  }

  get origin(): string {
    return this.#inner.origin;
  }

  get protocol(): string {
    return this.#inner.protocol;
  }

  set protocol(value: string) {
    this.#inner.protocol = value;
  }

  get username(): string {
    return this.#inner.username;
  }

  set username(value: string) {
    this.#inner.username = value;
  }

  get password(): string {
    return this.#inner.password;
  }

  set password(value: string) {
    this.#inner.password = value;
  }

  get host(): string {
    return this.#inner.host;
  }

  set host(value: string) {
    this.#inner.host = value;
  }

  get hostname(): string {
    return this.#inner.hostname;
  }

  set hostname(value: string) {
    this.#inner.hostname = value;
  }

  get port(): string {
    return this.#inner.port;
  }

  set port(value: string) {
    this.#inner.port = value;
  }

  get pathname(): string {
    return this.#inner.pathname;
  }

  set pathname(value: string) {
    this.#inner.pathname = value;
  }

  get search(): string {
    return this.#inner.search;
  }

  set search(value: string) {
    this.#inner.search = value;
  }

  get searchParams(): URLSearchParams {
    return wrapURLSearchParams(this.#inner.searchParams);
  }

  get hash(): string {
    return this.#inner.hash;
  }

  set hash(value: string) {
    this.#inner.hash = value;
  }

  toString(): string {
    return this.#inner.toString();
  }

  toJSON(): string {
    return this.#inner.toJSON();
  }
}
