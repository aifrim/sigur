import { afterEach, describe, expect, it, vi } from "vitest";
import { Headers } from "../src/builtins/headers.ts";
import { unwrap } from "../src/builtins/inner.ts";
import { Response, wrapResponse } from "../src/builtins/response.ts";

describe("Response", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("from constructs a Response with body and init", () => {
    const result = Response.from('{"a":1}', {
      status: 201,
      statusText: "Created",
      headers: { "content-type": "application/json" },
    });

    if (result.isOkay()) {
      expect(result.value).toBeInstanceOf(Response);
      expect(unwrap<globalThis.Response>(result.value)).toBeInstanceOf(globalThis.Response);
      expect(result.value.status).toBe(201);
      expect(result.value.statusText).toBe("Created");
      expect(result.value.ok).toBe(true);
      expect(result.value.bodyUsed).toBe(false);
      expect(result.value.headers).toBeInstanceOf(Headers);
      expect(result.value.headers.get("content-type")).toBe("application/json");
    } else {
      expect.unreachable();
    }
  });

  it("from returns err for invalid status", () => {
    const result = Response.from(null, { status: 9999 });

    if (result.isNotOkay()) {
      expect(result.error).toBeInstanceOf(RangeError);
    } else {
      expect.unreachable();
    }
  });

  it("wrapResponse preserves native identity and delegates getters", () => {
    const native = new globalThis.Response("hi", { status: 200 });
    const wrapped = wrapResponse(native);

    expect(wrapped).toBeInstanceOf(Response);
    expect(unwrap<globalThis.Response>(wrapped)).toBe(native);
    expect(wrapped.status).toBe(200);
    expect(wrapped.ok).toBe(true);
    expect(wrapped.headers).toBeInstanceOf(Headers);
    expect(unwrap<globalThis.Headers>(wrapped.headers)).toBe(native.headers);
  });

  it("text returns ok with body string", async () => {
    const created = Response.from("hello");

    if (created.isOkay()) {
      const result = await created.value.text();

      if (result.isOkay()) {
        expect(result.value).toBe("hello");
        expect(created.value.bodyUsed).toBe(true);
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("json returns ok with parsed value", async () => {
    const created = Response.from('{"a":1}', {
      headers: { "content-type": "application/json" },
    });

    if (created.isOkay()) {
      const result = await created.value.json();

      if (result.isOkay()) {
        expect(result.value).toEqual({ a: 1 });
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("json returns err for invalid JSON", async () => {
    const created = Response.from("{");

    if (created.isOkay()) {
      const result = await created.value.json();

      if (result.isNotOkay()) {
        expect(result.error).toBeInstanceOf(Error);
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("arrayBuffer returns ok with ArrayBuffer", async () => {
    const created = Response.from("ab");

    if (created.isOkay()) {
      const result = await created.value.arrayBuffer();

      if (result.isOkay()) {
        expect(result.value).toBeInstanceOf(ArrayBuffer);
        expect(new TextDecoder().decode(result.value)).toBe("ab");
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("blob returns ok with Blob", async () => {
    const created = Response.from("blob-body", {
      headers: { "content-type": "text/plain" },
    });

    if (created.isOkay()) {
      const result = await created.value.blob();

      if (result.isOkay()) {
        expect(result.value).toBeInstanceOf(Blob);
        expect(await result.value.text()).toBe("blob-body");
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("bytes returns ok with Uint8Array", async () => {
    const created = Response.from("xy");

    if (created.isOkay()) {
      const result = await created.value.bytes();

      if (result.isOkay()) {
        expect(result.value).toBeInstanceOf(Uint8Array);
        expect(new TextDecoder().decode(result.value)).toBe("xy");
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("formData returns ok with FormData", async () => {
    const body = new FormData();
    body.set("name", "sigur");

    const created = Response.from(body);

    if (created.isOkay()) {
      const result = await created.value.formData();

      if (result.isOkay()) {
        expect(result.value).toBeInstanceOf(FormData);
        expect(result.value.get("name")).toBe("sigur");
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("body readers return err when the native method rejects", async () => {
    const native = new globalThis.Response("once");
    const wrapped = wrapResponse(native);

    await wrapped.text();

    const second = await wrapped.text();

    if (second.isNotOkay()) {
      expect(second.error).toBeInstanceOf(Error);
    } else {
      expect.unreachable();
    }
  });

  it("clone returns ok with an independent body", async () => {
    const created = Response.from("clone-me");

    if (created.isOkay()) {
      const cloned = created.value.clone();

      if (cloned.isOkay()) {
        const originalText = await created.value.text();
        const clonedText = await cloned.value.text();

        if (originalText.isOkay() && clonedText.isOkay()) {
          expect(originalText.value).toBe("clone-me");
          expect(clonedText.value).toBe("clone-me");
          expect(unwrap<globalThis.Response>(cloned.value)).not.toBe(
            unwrap<globalThis.Response>(created.value),
          );
        } else {
          expect.unreachable();
        }
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("clone returns err when the body was already used", async () => {
    const created = Response.from("used");

    if (created.isOkay()) {
      await created.value.text();

      const cloned = created.value.clone();

      if (cloned.isNotOkay()) {
        expect(cloned.error).toBeInstanceOf(TypeError);
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("error static returns a network-error Response", () => {
    const result = Response.error();

    if (result.isOkay()) {
      expect(result.value).toBeInstanceOf(Response);
      expect(result.value.type).toBe("error");
      expect(result.value.status).toBe(0);
    } else {
      expect.unreachable();
    }
  });

  it("redirect static returns ok for a valid redirect", () => {
    const result = Response.redirect("https://example.com/next", 302);

    if (result.isOkay()) {
      expect(result.value.status).toBe(302);
      expect(result.value.headers.get("location")).toBe("https://example.com/next");
    } else {
      expect.unreachable();
    }
  });

  it("redirect static returns err for an invalid status", () => {
    const result = Response.redirect("https://example.com/", 200);

    if (result.isNotOkay()) {
      expect(result.error).toBeInstanceOf(RangeError);
    } else {
      expect.unreachable();
    }
  });

  it("json static returns ok with JSON body and content-type", async () => {
    const result = Response.json({ a: 1 });

    if (result.isOkay()) {
      expect(result.value.headers.get("content-type")).toMatch(/application\/json/);

      const parsed = await result.value.json();

      if (parsed.isOkay()) {
        expect(parsed.value).toEqual({ a: 1 });
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("textStream forwards when present on the native body", () => {
    const stream = new ReadableStream();
    const textStream = vi.fn(() => stream);
    const native = new globalThis.Response("x");

    Object.defineProperty(native, "textStream", {
      value: textStream,
      configurable: true,
    });

    const wrapped = wrapResponse(native);

    expect(wrapped.textStream()).toBe(stream);
    expect(textStream).toHaveBeenCalledOnce();
  });

  it("textStream throws when unsupported", () => {
    const wrapped = wrapResponse(new globalThis.Response("x"));

    expect(() => wrapped.textStream()).toThrow(TypeError);
  });

  it("constructs through globalThis.Response so stubs work", () => {
    const NativeResponse = globalThis.Response;
    const stub = vi.fn(
      (body?: BodyInit | null, init?: ResponseInit) => new NativeResponse(body, init),
    );

    vi.stubGlobal("Response", stub);

    const result = Response.from("stubbed", { status: 200 });

    expect(stub).toHaveBeenCalled();

    if (result.isOkay()) {
      expect(result.value.status).toBe(200);
    } else {
      expect.unreachable();
    }
  });
});
