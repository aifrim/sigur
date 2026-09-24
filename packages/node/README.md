# @sigurjs/node

Result-returning mirrors of Node/JS **globals** (no `node:` imports yet). Built on [`@sigurjs/core`](https://github.com/aifrim/sigur/tree/main/packages/core). Part of [sigur](https://github.com/aifrim/sigur).

Imports shadow the globals on purpose so call sites stay familiar while failures become `Result` / `ResultAsync`.

## Install

```bash
pnpm add @sigurjs/core @sigurjs/node
```

**Requirements:** Node `>=24`.

## Quick start

```ts
import { JSON, fetch, URL } from "@sigurjs/node";

const parsed = JSON.parse('{"a":1}');

if (parsed.isOkay()) {
  console.log(parsed.value); // unknown — validate yourself
} else {
  console.error(parsed.error); // SyntaxError, etc.
}

const url = URL.from("https://example.com");

if (url.isOkay()) {
  const response = await fetch(url.value);

  if (response.isOkay()) {
    console.log(response.value.status); // HTTP 4xx/5xx still Ok
  } else {
    console.error(response.error); // network / abort
  }
}
```

Always call through `globalThis` under the hood, so stubs of the real globals work in tests.

## Why wrap these?

Each export matches a global that fails **outside** the normal return type (throw or Promise rejection). `@sigurjs/node` turns that into `Result` / `ResultAsync` so you extract the value, extract the error, or return upstream — no try/catch.

| Export | Native failure mode |
| ------ | ------------------- |
| `JSON.parse` / `JSON.stringify` | throw (`SyntaxError`, circular / `BigInt`, …) |
| `decodeURI` / `decodeURIComponent` / `encodeURI` / `encodeURIComponent` | throw `URIError` (bad escapes / lone surrogates) |
| `structuredClone` | throw on non-cloneable values |
| `URL.from` | `new globalThis.URL` throws `TypeError` |
| `URL.parse` | native returns `null` → `ErrResult` |
| `URL.createObjectURL` | can throw → `Result` |
| `fetch` | Promise rejects (network / abort); HTTP 4xx/5xx still **ok** with a sigur `Response` |
| `Request.from` | `new globalThis.Request` throws → `Result` |
| `Response.from` / statics | constructor / statics throw → `Result`; body readers → `ResultAsync` |
| `Headers.from` | `new globalThis.Headers` throws → `Result` |
| `URLSearchParams.from` | `new globalThis.URLSearchParams` throws → `Result` |

## Notes

- `URL` uses a private constructor: `new` cannot return a `Result`, so use `URL.from` / `URL.parse`. Instance getters/setters match [MDN `URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL) (`origin` / `searchParams` read-only). Setters throw like native. `canParse` / `revokeObjectURL` are thin forwards (no `Result`).
- `URL`, `URLSearchParams`, `Request`, `Response`, and `Headers` are **not** subclasses of the native types. There is no public `.native` escape hatch; interop with `globalThis.fetch` and friends is handled inside the package.
- Mutators on `Headers` / `URLSearchParams` throw like native when the underlying object rejects the operation.
- Prefer positive checks (`isOkay` / `isErr`) so TypeScript narrows — see [`@sigurjs/core`](https://github.com/aifrim/sigur/tree/main/packages/core).

## API

| Export | Notes |
| ------ | ----- |
| `JSON.parse` / `JSON.stringify` | sync `Result` |
| `decodeURI` / `decodeURIComponent` / `encodeURI` / `encodeURIComponent` | sync `Result` |
| `structuredClone` | sync `Result` |
| `URL.from` / `URL.parse` | `Result<URL, Error>` |
| `URL.canParse` | `boolean` |
| `URL.createObjectURL` | `Result<string, Error>` |
| `URL.revokeObjectURL` | `void` |
| `URL` instance | MDN properties + `toString` / `toJSON`; `searchParams` is sigur `URLSearchParams` (live) |
| `URLSearchParams` | `from` → `Result`; mutators throw like native |
| `Request.from` | `Result<Request, Error>`; body readers → `ResultAsync`; `clone` → `Result` |
| `Response.from` / `error` / `redirect` / `json` | `Result<Response, Error>`; body readers → `ResultAsync`; `clone` → `Result` |
| `Headers.from` | `Result<Headers, Error>`; mutators throw like native |
| `fetch` | `ResultAsync<Response, Error>` (sigur `Response`; HTTP 4xx/5xx remain ok Results) |
