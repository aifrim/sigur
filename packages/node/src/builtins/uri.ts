import { sure } from "@sigurjs/core";

/**
 * URI encode/decode globals.
 *
 * **Why wrap:** they throw {@link URIError} on malformed input (bad `%` sequences
 * when decoding, lone surrogates when encoding). Same rationale as {@link JSON.parse}:
 * fallible globals → `Result` so callers extract or return upstream without try/catch.
 */

/** {@link globalThis.decodeURI} → `Result` (`URIError` on bad escapes). */
export const decodeURI = sure(globalThis.decodeURI);

/** {@link globalThis.decodeURIComponent} → `Result` (`URIError` on bad escapes). */
export const decodeURIComponent = sure(globalThis.decodeURIComponent);

/** {@link globalThis.encodeURI} → `Result` (`URIError` on lone surrogates). */
export const encodeURI = sure(globalThis.encodeURI);

/** {@link globalThis.encodeURIComponent} → `Result` (`URIError` on lone surrogates). */
export const encodeURIComponent = sure(globalThis.encodeURIComponent);
