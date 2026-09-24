/**
 * @sigur/node **builtins** — Result-returning Node/JS globals (no `node:` imports).
 *
 * Each export exists because the matching global is fallible in a way that leaves
 * the type system (throw or Promise rejection). Wrapping with {@link sure} from
 * `@sigur/core` turns that into `Result` / `ResultAsync` so callers extract the
 * value, extract the error, or return upstream — without try/catch.
 *
 * | Export | Native failure mode |
 * |--------|---------------------|
 * | {@link JSON} | `parse` / `stringify` throw (`SyntaxError`, circular / BigInt, …) |
 * | URI encode/decode | throw {@link URIError} |
 * | {@link structuredClone} | throws on non-cloneable values |
 * | {@link URL} | `from`/`parse` → Result; setters throw; `createObjectURL` → Result |
 * | {@link URLSearchParams} | `from` → Result; mutators throw like native |
 * | {@link fetch} | Promise rejects (network / abort); HTTP errors stay ok with sigur Response |
 * | {@link Request} | `from` → Result; body readers → ResultAsync; `clone` → Result |
 * | {@link Response} | `from`/statics → Result; body readers → ResultAsync; `clone` → Result |
 * | {@link Headers} | `from` → Result; mutators throw like native |
 *
 * Imports shadow the globals on purpose:
 * `import { JSON, fetch, URL, Request, Response } from "@sigur/node"`.
 * Use `URL.from` / `URL.parse` (`new` cannot return a `Result`).
 *
 * @packageDocumentation
 */
export { fetch } from "./fetch.ts";
export { Headers } from "./headers.ts";
export { JSON } from "./json.ts";
export { Request } from "./request.ts";
export { Response } from "./response.ts";
export { structuredClone } from "./structured-clone.ts";
export {
  decodeURI,
  decodeURIComponent,
  encodeURI,
  encodeURIComponent,
} from "./uri.ts";
export { URL } from "./url.ts";
export { URLSearchParams } from "./url-search-params.ts";
