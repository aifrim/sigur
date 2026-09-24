import { afterEach, describe, expect, it, vi } from "vitest";
import { unwrap } from "../src/builtins/inner.ts";
import { Request } from "../src/builtins/request.ts";
import { Response } from "../src/builtins/response.ts";
import { URL } from "../src/builtins/url.ts";
import { fetch } from "../src/index.ts";

describe("fetch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns ok with a sigur Response on resolve", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new globalThis.Response("ok", { status: 200 })),
    );

    const result = await fetch("https://example.com");

    if (result.isOkay()) {
      expect(result.value).toBeInstanceOf(Response);
      expect(result.value).not.toBeInstanceOf(globalThis.Response);
      expect(result.value.status).toBe(200);
      expect(result.value.ok).toBe(true);
    } else {
      expect.unreachable();
    }
  });

  it("returns ok for HTTP error statuses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new globalThis.Response("fail", { status: 500 })),
    );

    const result = await fetch("https://example.com");

    if (result.isOkay()) {
      expect(result.value).toBeInstanceOf(Response);
      expect(result.value.status).toBe(500);
      expect(result.value.ok).toBe(false);
    } else {
      expect.unreachable();
    }
  });

  it("returns err when fetch rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("network down");
      }),
    );

    const result = await fetch("https://example.com");

    if (result.isNotOkay()) {
      expect(result.error).toBeInstanceOf(TypeError);
      expect(result.error.message).toBe("network down");
    } else {
      expect.unreachable();
    }
  });

  it("unwraps a sigur URL", async () => {
    const stub = vi.fn(async () => new globalThis.Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", stub);

    const urlResult = URL.from("https://example.com/path");

    if (urlResult.isNotOkay()) {
      expect.unreachable();
    }

    const result = await fetch(urlResult.value);

    expect(stub).toHaveBeenCalledOnce();
    expect(stub.mock.calls[0]?.[0]).toBe(unwrap<globalThis.URL>(urlResult.value));

    if (result.isOkay()) {
      expect(result.value).toBeInstanceOf(Response);
    } else {
      expect.unreachable();
    }
  });

  it("unwraps a sigur Request", async () => {
    const stub = vi.fn(async () => new globalThis.Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", stub);

    const requestResult = Request.from("https://example.com", { method: "POST" });

    if (requestResult.isNotOkay()) {
      expect.unreachable();
    }

    const result = await fetch(requestResult.value);

    expect(stub).toHaveBeenCalledOnce();
    expect(stub.mock.calls[0]?.[0]).toBe(unwrap<globalThis.Request>(requestResult.value));

    if (result.isOkay()) {
      expect(result.value).toBeInstanceOf(Response);
    } else {
      expect.unreachable();
    }
  });

  it("forwards init to globalThis.fetch", async () => {
    const stub = vi.fn(async () => new globalThis.Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", stub);

    const init = {
      method: "POST",
      headers: { "x-test": "1" },
    };

    const result = await fetch("https://example.com", init);

    expect(stub).toHaveBeenCalledOnce();
    expect(stub.mock.calls[0]?.[0]).toBe("https://example.com");
    expect(stub.mock.calls[0]?.[1]).toBe(init);

    if (result.isOkay()) {
      expect(result.value).toBeInstanceOf(Response);
    } else {
      expect.unreachable();
    }
  });
});
