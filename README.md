# sigur

Errors as values for JavaScript and TypeScript — remove the need for `throw` / `try` / `catch` / `finally` by returning errors.

**Sigur** 🇷🇴 ≈ “sure”: take something unsure, make the call sure. The main helper is `sure(fn)`. I am sure that this won't `throw`.

## Why

I hate being hit with **undocumented exceptions** — some `Error` thrown from deep in the stack because something went wrong, with nothing in the types to warn me. I want a way out from the start: failure visible in the return type, so TypeScript helps me handle it instead of hoping I remembered a `try` / `catch`.

## Packages


| Package                          | Description                                          |
| -------------------------------- | ---------------------------------------------------- |
| `[@sigurjs/core](packages/core)` | `Result`, `ResultAsync`, `sure()`                    |
| `[@sigurjs/node](packages/node)` | Result-returning globals (`JSON`, `fetch`, `URL`, …) |


Further `node:` stdlib wrappers will land in `@sigurjs/node` later.

**Requires Node.js 24 or newer.**

## Model

In JS/TS, failure often leaves the type system — functions throw, Promises reject, and callers forget to catch or wrap everything in broad `try` / `catch`. Control flow jumps; TypeScript cannot force you to handle failure.

Sigur turns exceptions into values. Fallible work returns a `Result`: okay (`OkResult`) or not okay (`ErrResult`). At every call site you do **one** of:

1. **Extract the value** — `isOkay()` then `.value`
2. **Extract the error** — `isErr()` then `.error`
3. **Return upstream** — `return result`

```text
unsure function  ──sure()──►  Result-returning function
                                    │
                                    ▼
                              Result<T, E>
                           ┌──────┴──────┐
                           ▼             ▼
                      OkResult        ErrResult
                     (value: T)      (error: E)
```


| Concern             | With throw/catch | With Result                                        |
| ------------------- | ---------------- | -------------------------------------------------- |
| Visible in types    | No               | Yes — `Result<T, E>`                               |
| Handle or propagate | Unclear          | Extract value, extract error, or `return` upstream |
| Easy to forget      | Yes              | Narrowing forces a branch                          |


`sure` is the bridge for third-party code that still throws. `@sigurjs/core` is runtime-agnostic; `@sigurjs/node` ships Result-returning globals.

## Usage

```bash
pnpm add @sigurjs/core
pnpm add @sigurjs/node   # optional Result-returning globals
```

Wrap an unsure function with `sure` (or use `@sigurjs/node` globals that already return `Result`):

```ts
import { sure } from "@sigurjs/core";
import { JSON } from "@sigurjs/node";

const parse = sure(globalThis.JSON.parse);
parse('{"a":1}');      // Result — never throws
JSON.parse('{"a":1}'); // same idea, packaged
```

- Sync → `Result`; async / Promise-returning → `ResultAsync` (`await` → `Result`)
- Thrown / rejected causes map with `toError` → `Result<T, Error>`
- Build your own with `Ok()` / `Ok(value)` / `Err("message")` / `Err("message", { cause })`
- `sure(fn, { finally })` runs cleanup after a **failed** attempt; if cleanup also throws → `AggregateError`
- Reshape errors by extracting and `return Err("…", { cause })`

Prefer positive checks (`isOkay` / `isErr`) so TypeScript narrows. Also available: `instanceof OkResult` / `ErrResult` / `Result`.

Package API tables: `[@sigurjs/core](packages/core)` · `[@sigurjs/node](packages/node)`

## Example

Without Sigur — failures throw or reject:

```ts
type Data = { id: number; name: string };

async function getData(url: string): Promise<Data> {
  const response = await fetch(url);
  return response.json() as Promise<Data>;
}

const data = await getData("https://api.example.com/item/1");
console.log(data.name);
```

It looks small, but a lot is hidden: network failures reject, non-OK HTTP still “succeeds,” `json()` can throw, and `as Data` trusts the payload. Those gaps show up in production.

With Sigur — the same steps return `Result`. It is more verbose on purpose: each fallible step is visible, and `parseData` forces you to treat JSON as `unknown` until it matches the type.

```ts
import { Err, Ok, type Result } from "@sigurjs/core";
import { fetch } from "@sigurjs/node";

type Data = { id: number; name: string };

function parseData(value: unknown): Result<Data, Error> {
  if (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    typeof value.id === "number" &&
    typeof value.name === "string"
  ) {
    return Ok({ id: value.id, name: value.name });
  }

  return Err("invalid Data");
}

async function getData(url: string): Promise<Result<Data, Error>> {
  const response = await fetch(url);

  if (response.isErr()) {
    return Err(`failed to fetch ${url}`, { cause: response.error });
  }

  const json = await response.value.json();

  if (json.isErr()) {
    return Err("failed to parse response JSON", { cause: json.error });
  }

  return parseData(json.value);
}

const data = await getData("https://api.example.com/item/1");

if (data.isOkay()) {
  console.log(data.value.name);
} else {
  console.error(data.error);
}
```

And imagine using it with a dependency you cannot inspect at development time due to the way TypeScript is compiled:

```ts
// From a published SDK — types say Promise<Data>, but you only get .d.ts + JS.
import { sure } from "@sigurjs/core";
import { getItem } from "some-api-sdk";

const data = await getItem("1"); // typechecks
console.log(data.name);          // runtime: maybe undefined, wrong shape, or a throw

const safeGetItem = sure(getItem);
const result = await safeGetItem("1"); // Result<Data, Error> — throws become Err

if (result.isOkay()) {
  console.log(result.value.name); // still trusts the SDK's type — validate yourself
} else {
  console.error(result.error);
}
```

`sure` turns SDK throws and rejections into a `Result`. The success type is still whatever the SDK declared — a wrong shape will not become `Err` unless you validate (e.g. `parseData`) at your boundary.