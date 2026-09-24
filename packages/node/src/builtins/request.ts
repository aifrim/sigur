import { Err, Ok, type Result, ResultAsync, sure } from "@sigurjs/core";
import { type Headers, wrapHeaders } from "./headers.ts";
import { registerInner, unwrap } from "./inner.ts";
import { URL } from "./url.ts";

type RequestInfoInput = string | globalThis.URL | URL | globalThis.Request | Request;

type NativeRequestInfo = string | globalThis.URL | globalThis.Request;

/** Node/undici fields that may exist on the runtime `Request` beyond DOM typings. */
type NativeRequest = globalThis.Request & {
  duplex?: RequestDuplex;
  isHistoryNavigation?: boolean;
  isReloadNavigation?: boolean;
  textStream?: () => ReadableStream<Uint8Array>;
};

type RequestDuplex = "half";

function toNativeInfo(input: RequestInfoInput): NativeRequestInfo {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof Request) {
    return unwrap<globalThis.Request>(input);
  }

  if (input instanceof URL) {
    return unwrap<globalThis.URL>(input);
  }

  return input;
}

/** `new globalThis.Request(...)` as a `Result` — used by {@link Request.from}. */
const createNative = sure((input: NativeRequestInfo, init?: RequestInit) =>
  init === undefined ? new globalThis.Request(input) : new globalThis.Request(input, init),
);

/**
 * Wrapper around {@link globalThis.Request} (MDN Request / Body surface; Node >= 22).
 *
 * **Why wrap:** `new globalThis.Request(...)` throws on invalid URL / forbidden
 * init. Body readers reject when the body is already consumed. Construct only via
 * {@link Request.from} (`new` on this class cannot return a `Result`).
 *
 * Body Promise readers return {@link ResultAsync}. {@link Request.clone} returns
 * `Result` (native throws when the body is disturbed). Instance getters match native;
 * `duplex` / `textStream` are forwarded when present on the inner instance.
 */
export class Request {
  readonly #inner: NativeRequest;

  private constructor(inner: globalThis.Request) {
    this.#inner = inner;
    registerInner(this, inner); // see inner.ts
  }

  /** Like `new globalThis.Request(...)`, but returns a `Result` instead of throwing. */
  static from(input: RequestInfoInput, init?: RequestInit): Result<Request, Error> {
    const native = createNative(toNativeInfo(input), init);

    if (native.isOkay()) {
      return Ok(new Request(native.value));
    }

    if (native.isErr()) {
      return Err(native.error);
    }

    return Err(new TypeError("unreachable"));
  }

  get url(): string {
    return this.#inner.url;
  }

  get method(): string {
    return this.#inner.method;
  }

  get headers(): Headers {
    return wrapHeaders(this.#inner.headers);
  }

  get body(): ReadableStream<Uint8Array> | null {
    return this.#inner.body;
  }

  get bodyUsed(): boolean {
    return this.#inner.bodyUsed;
  }

  get cache(): RequestCache {
    return this.#inner.cache;
  }

  get credentials(): RequestCredentials {
    return this.#inner.credentials;
  }

  get destination(): RequestDestination {
    return this.#inner.destination;
  }

  get integrity(): string {
    return this.#inner.integrity;
  }

  get keepalive(): boolean {
    return this.#inner.keepalive;
  }

  get mode(): RequestMode {
    return this.#inner.mode;
  }

  get redirect(): RequestRedirect {
    return this.#inner.redirect;
  }

  get referrer(): string {
    return this.#inner.referrer;
  }

  get referrerPolicy(): ReferrerPolicy {
    return this.#inner.referrerPolicy;
  }

  get signal(): AbortSignal {
    return this.#inner.signal;
  }

  /** Node/Undici `duplex` when present on the native instance. */
  get duplex(): RequestDuplex | undefined {
    return this.#inner.duplex;
  }

  /** Node (undici) getter when present on the native instance. */
  get isHistoryNavigation(): boolean | undefined {
    return this.#inner.isHistoryNavigation;
  }

  /** Node (undici) getter when present on the native instance. */
  get isReloadNavigation(): boolean | undefined {
    return this.#inner.isReloadNavigation;
  }

  /**
   * Clone via native `Request.clone()` as a `Result`
   * (throws `TypeError` when the body is already used).
   */
  clone(): Result<Request, Error> {
    const cloned = sure(() => this.#inner.clone())();

    if (cloned.isOkay()) {
      return Ok(new Request(cloned.value));
    }

    if (cloned.isErr()) {
      return Err(cloned.error);
    }

    return Err(new TypeError("unreachable"));
  }

  /**
   * Undici/MDN Body `textStream()` when present — returns a stream, not a Promise.
   * Throws `TypeError` if the native instance does not implement it.
   */
  textStream(): ReadableStream<Uint8Array> {
    const textStream = this.#inner.textStream;

    if (typeof textStream !== "function") {
      throw new TypeError("Request.prototype.textStream is not available");
    }

    return textStream.call(this.#inner);
  }

  arrayBuffer(): ResultAsync<ArrayBuffer, Error> {
    return ResultAsync.fromPromise(this.#inner.arrayBuffer());
  }

  blob(): ResultAsync<Blob, Error> {
    return ResultAsync.fromPromise(this.#inner.blob());
  }

  bytes(): ResultAsync<Uint8Array, Error> {
    return ResultAsync.fromPromise(this.#inner.bytes());
  }

  formData(): ResultAsync<FormData, Error> {
    return ResultAsync.fromPromise(this.#inner.formData());
  }

  json(): ResultAsync<unknown, Error> {
    return ResultAsync.fromPromise(this.#inner.json());
  }

  text(): ResultAsync<string, Error> {
    return ResultAsync.fromPromise(this.#inner.text());
  }
}
