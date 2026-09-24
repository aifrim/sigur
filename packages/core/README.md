# @sigur/core

Errors as values for JavaScript and TypeScript. A `Result` is for extracting the value, extracting the error, or returning upstream — no `throw` / `try` / `catch` required.

Works anywhere JS runs (Node, Bun, Deno, browsers, React Native). Platform helpers live in [`@sigur/node`](https://www.npmjs.com/package/@sigur/node) (`JSON`, `fetch`, `URL`, …).

## Install

```bash
pnpm add @sigur/core
```

## Quick start

Wrap a third-party SDK (or any throwing / rejecting API) with `sure`:

```ts
import { sure } from "@sigur/core";
import { getItem } from "some-api-sdk";

const safeGetItem = sure(getItem);
const result = await safeGetItem("1"); // Result — throws / rejects become Err

if (result.isOkay()) {
  console.log(result.value); // extract value — still trusts the SDK's type
} else {
  console.error(result.error); // extract error
}
```

`sure` is the bridge when you only have `.d.ts` + JS and cannot see how the package fails. Success typing is still the SDK's claim — validate the shape yourself if you need a domain type.

## API


| Export                                    | Purpose                                                            |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `Result` / `OkResult` / `ErrResult`       | Sync success or failure as data                                    |
| `Ok(value)` / `Err(error)`                | Construct a `Result`                                               |
| `sure(fn, options?)`                      | Unsure (throwing / rejecting) function → Result-returning function |
| `toError(cause)`                          | Normalize any thrown / rejected value to `Error`                   |
| `ResultAsync` / `ResultAsync.fromPromise` | Async wrapper; `await` → `Result`                                  |


### Result

At every call site, do one of:

1. `isOkay()` then `.value`
2. `isNotOkay()` then `.error`
3. `return result` upstream

Prefer positive checks so TypeScript narrows. Also available: `result.ok`, `instanceof OkResult` / `ErrResult` / `Result`.

Sync functions → `Result`. Async / Promise-returning → `ResultAsync`. Thrown / rejected causes map with `toError` → `Result<T, Error>`. Reshape with `return Err(newError)`.

### `sure` and `finally`

```ts
const doWork = sure(
  () => risky(),
  {
    finally: () => cleanup(),
  },
);
```

`finally` runs after a **failed** attempt. If both the operation and cleanup throw, Sigur returns an `AggregateError` so cleanup cannot swallow the original failure.

