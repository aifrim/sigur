# @sigurjs/core

Errors as values for JavaScript and TypeScript. Part of [sigur](https://github.com/aifrim/sigur) 

A `Result` is for extracting the value, extracting the error, or returning upstream — no `throw` / `try` / `catch` required at the call site.

Works anywhere JS runs (Node, Bun, Deno, browsers, React Native). Result-returning globals (`JSON`, `fetch`, `URL`, …) live in `[@sigurjs/node](https://github.com/aifrim/sigur/tree/main/packages/node)`.

## Install

```bash
pnpm add @sigurjs/core
```

**Requirements:** Node `>=24` (or any modern JS runtime that can import ESM).

## Quick start

Wrap a third-party SDK (or any throwing / rejecting API) with `sure`:

```ts
import { sure } from "@sigurjs/core";
import { getItem } from "some-api-sdk";

const safeGetItem = sure(getItem);
const result = await safeGetItem("1"); // Result — throws / rejects become Err

if (result.isOkay()) {
  console.log(result.value); // still trusts the SDK's type
} else {
  console.error(result.error);
}
```

`sure` is the bridge when you only have `.d.ts` + JS and cannot see how the package fails. Success typing is still the SDK's claim — validate the shape yourself if you need a domain type.

### Construct your own `Result`

```ts
import { Err, Ok, type Result } from "@sigurjs/core";

function parseId(raw: string): Result<number, Error> {
  const n = Number(raw);

  if (Number.isFinite(n)) {
    return Ok(n);
  }

  return Err(`invalid id: ${raw}`);
}

const id = parseId("42");

if (id.isOkay()) {
  console.log(id.value);
} else {
  console.error(id.error);
}
```



### Async

Sync functions return `Result`. Async / Promise-returning functions wrapped with `sure` return `ResultAsync` — `await` to get a `Result`. You can also wrap an existing Promise:

```ts
import { ResultAsync } from "@sigurjs/core";

const result = await ResultAsync.fromPromise(fetch("https://example.com"));
```



## Call sites

At every call site, do **one** of:

1. **Extract the value** — `isOkay()` then `.value`
2. **Extract the error** — `isNotOkay()` then `.error`
3. **Return upstream** — `return result`

Prefer positive checks so TypeScript narrows to `OkResult` / `ErrResult`. Also available: `result.ok`, `instanceof OkResult` / `ErrResult` / `Result`.

## `sure` and `finally`

```ts
import { sure } from "@sigurjs/core";

const doWork = sure(
  () => risky(),
  {
    finally: () => cleanup(),
  },
);
```

`finally` runs after a **failed** attempt. If both the operation and cleanup throw, Sigur returns an `AggregateError` so cleanup cannot swallow the original failure.

## API


| Export                                    | Purpose                                                               |
| ----------------------------------------- | --------------------------------------------------------------------- |
| `Result` / `OkResult` / `ErrResult`       | Sync success or failure as data                                       |
| `Ok(value)` / `Err(...)`                  | Construct a `Result`; `Err("msg", { cause })` / `Err(err, { cause })` |
| `sure(fn, options?)`                      | Unsure (throwing / rejecting) function → Result-returning function    |
| `toError(cause)`                          | Normalize any thrown / rejected value to `Error`                      |
| `ResultAsync` / `ResultAsync.fromPromise` | Async wrapper; `await` → `Result`                                     |


Thrown / rejected causes map with `toError` → `Result<T, Error>`. Reshape errors by extracting and `return Err("…", { cause })` (or `Err(error)`).
