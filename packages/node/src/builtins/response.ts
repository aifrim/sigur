import { Err, Ok, type Result, ResultAsync, sure } from "@sigurjs/core";
import { type Headers, wrapHeaders } from "./headers.ts";
import { registerInner } from "./inner.ts";

/** Node/undici fields that may exist on the runtime `Response` beyond DOM typings. */
type NativeResponse = globalThis.Response & {
  textStream?: () => ReadableStream;
};

/**
 * Wrap a known-good native {@link globalThis.Response} without re-running
 * fallible construction. Used by `fetch` (and tests); not part of the public barrel.
 */
export function wrapResponse(native: globalThis.Response): Response {
  return Response.wrap(native);
}

const createNative = sure(
  (body?: BodyInit | null, init?: ResponseInit) => new globalThis.Response(body, init),
);

/**
 * Wrapper around {@link globalThis.Response} (MDN Response / Body surface; Node >= 22).
 *
 * **Why wrap:** The native constructor and static helpers can throw; body readers
 * reject their Promises on parse / locked / consumed-body failures. Construct via
 * {@link Response.from} / statics; body readers return {@link ResultAsync}.
 *
 * Instance getters match the native API. Call through `globalThis.Response` for
 * stubbability. Imports from `@sigurjs/node` shadow the global on purpose.
 */
export class Response {
  readonly #inner: NativeResponse;

  private constructor(inner: globalThis.Response) {
    this.#inner = inner;
    registerInner(this, inner); // see inner.ts
  }

  /** @internal Known-good native wrap; prefer {@link wrapResponse} outside this class. */
  static wrap(native: globalThis.Response): Response {
    return new Response(native);
  }

  /** Like `new globalThis.Response(...)`, but returns a `Result` instead of throwing. */
  static from(body?: BodyInit | null, init?: ResponseInit): Result<Response, Error> {
    const native = createNative(body, init);

    if (native.isOkay()) {
      return Ok(new Response(native.value));
    }

    if (native.isErr()) {
      return Err(native.error);
    }

    return Err(new TypeError("unreachable"));
  }

  /** {@link globalThis.Response.error} as a `Result`. */
  static error = sure(() => new Response(globalThis.Response.error()));

  /** {@link globalThis.Response.redirect} as a `Result` (can throw `TypeError` / `RangeError`). */
  static redirect = sure(
    (url: string | globalThis.URL, status?: number) =>
      new Response(
        status === undefined
          ? globalThis.Response.redirect(url)
          : globalThis.Response.redirect(url, status),
      ),
  );

  /** {@link globalThis.Response.json} as a `Result`. */
  static json = sure(
    (data: unknown, init?: ResponseInit) => new Response(globalThis.Response.json(data, init)),
  );

  get body(): ReadableStream<Uint8Array> | null {
    return this.#inner.body;
  }

  get bodyUsed(): boolean {
    return this.#inner.bodyUsed;
  }

  get headers(): Headers {
    return wrapHeaders(this.#inner.headers);
  }

  get ok(): boolean {
    return this.#inner.ok;
  }

  get redirected(): boolean {
    return this.#inner.redirected;
  }

  get status(): number {
    return this.#inner.status;
  }

  get statusText(): string {
    return this.#inner.statusText;
  }

  get type(): ResponseType {
    return this.#inner.type;
  }

  get url(): string {
    return this.#inner.url;
  }

  /**
   * {@link globalThis.Response.clone} as a `Result`
   * (native throws `TypeError` if the body was already used).
   */
  clone(): Result<Response, Error> {
    return sure(() => new Response(this.#inner.clone()))();
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

  /**
   * Forward Undici/MDN {@link Body.textStream} when present on the native body.
   * Returns a `ReadableStream` (not a `ResultAsync`). Throws if unsupported.
   */
  textStream(): ReadableStream {
    const textStream = this.#inner.textStream;

    if (typeof textStream !== "function") {
      throw new TypeError("Response.textStream is not available");
    }

    return textStream.call(this.#inner);
  }
}
