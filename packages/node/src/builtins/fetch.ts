import { sure } from "@sigurjs/core";
import { unwrap } from "./inner.ts";
import { Request } from "./request.ts";
import { Response, wrapResponse } from "./response.ts";
import { URL } from "./url.ts";

type FetchInput = string | globalThis.URL | URL | globalThis.Request | Request;

function toNativeInput(input: FetchInput): string | globalThis.URL | globalThis.Request {
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

/**
 * Result-returning {@link globalThis.fetch}.
 *
 * **Why wrap:** `fetch` rejects its Promise on network failure, DNS errors, and
 * abort — not visible in the return type. This turns rejection into `ErrResult`.
 *
 * HTTP 4xx/5xx still resolve with a sigur {@link Response} (same as native); check
 * `response.ok` / `status` yourself after extracting the value.
 *
 * Accepts string, native `Request` / `URL`, and sigur {@link Request} / {@link URL}
 * (wrappers are unwrapped before calling `globalThis.fetch`).
 */
export const fetch = sure(async (input: FetchInput, init?: RequestInit) => {
  const native =
    init === undefined
      ? await globalThis.fetch(toNativeInput(input))
      : await globalThis.fetch(toNativeInput(input), init);

  return wrapResponse(native);
});
