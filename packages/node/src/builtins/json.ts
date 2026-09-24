import { sure } from "@sigur/core";

/**
 * Result-returning {@link globalThis.JSON}.
 *
 * **Why wrap:** `JSON.parse` throws `SyntaxError` on invalid text; `JSON.stringify`
 * throws on circular structures, `BigInt`, and some other values. Imports from
 * `@sigur/node` shadow the global on purpose; calls always go through `globalThis.JSON`.
 */
export const JSON = {
  parse: sure(globalThis.JSON.parse),
  stringify: sure(globalThis.JSON.stringify),
};
