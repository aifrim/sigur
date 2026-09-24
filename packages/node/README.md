# @sigur/node

Result-returning mirrors of Node/JS **globals** (no `node:` imports) under `src/builtins`. Built on `sure` from [`@sigur/core`](https://www.npmjs.com/package/@sigur/core). Requires **Node >= 22**.

Imports shadow the globals on purpose:

```ts
import { JSON, fetch, URL, Request, Response } from "@sigur/node";

JSON.parse("{"); // Result — does not throw
await fetch("https://example.com"); // ResultAsync<Response, Error> (sigur Response)
URL.from("https://example.com"); // Result<URL> — wraps globalThis.URL
```

## Install

```bash
pnpm add @sigur/core @sigur/node
```

## Why wrap these?

Each export matches a global that fails **outside** the normal return type (throw or Promise rejection). `@sigur/node` turns that into `Result` / `ResultAsync` so you extract the value, extract the error, or return upstream — no try/catch.

| Export | Native failure mode |
|--------|---------------------|
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

`URL` uses a private constructor: `new` cannot return a `Result`, so use `URL.from` / `URL.parse`. Instance getters/setters match [MDN `URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL) (`origin` / `searchParams` read-only). Setters throw like native. `canParse` / `revokeObjectURL` are thin forwards (no `Result`).

## API

| Export | Notes |
|--------|--------|
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

Always call through `globalThis` under the hood, so stubs of the real globals work in tests.

## Wrapper internals (not public API)

`URL`, `URLSearchParams`, `Request`, `Response`, and `Headers` keep a native instance in a private `#inner` field for delegation.

Private fields are not visible outside the class, so sibling builtins need another way to reach the native object. A shared module-private `WeakMap` plus `unwrap` (registered in each constructor via `registerInner`) provides that. Helpers are for in-package use and tests that import `src/builtins/*`; they are **not** re-exported from `@sigur/node`. There is no public `.native` escape hatch.
