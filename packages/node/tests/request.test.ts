import { afterEach, describe, expect, it, vi } from "vitest";
import { Headers } from "../src/builtins/headers.ts";
import { unwrap } from "../src/builtins/inner.ts";
import { Request } from "../src/builtins/request.ts";
import { URL } from "../src/builtins/url.ts";

describe("Request", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("from constructs from a string URL", () => {
    const result = Request.from("https://example.com/path", { method: "POST" });

    if (result.isOkay()) {
      expect(result.value).toBeInstanceOf(Request);
      expect(result.value.url).toBe("https://example.com/path");
      expect(result.value.method).toBe("POST");
      expect(unwrap<globalThis.Request>(result.value)).toBeInstanceOf(globalThis.Request);
    } else {
      expect.unreachable();
    }
  });

  it("from accepts native URL, sigur URL, native Request, and sigur Request", () => {
    const nativeUrl = new globalThis.URL("https://example.com/a");
    const fromNativeUrl = Request.from(nativeUrl);

    if (fromNativeUrl.isOkay()) {
      expect(fromNativeUrl.value.url).toBe("https://example.com/a");
    } else {
      expect.unreachable();
    }

    const sigurUrl = URL.from("https://example.com/b");

    if (sigurUrl.isOkay()) {
      const fromSigurUrl = Request.from(sigurUrl.value);

      if (fromSigurUrl.isOkay()) {
        expect(fromSigurUrl.value.url).toBe("https://example.com/b");
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }

    const nativeRequest = new globalThis.Request("https://example.com/c", {
      method: "PUT",
    });
    const fromNativeRequest = Request.from(nativeRequest);

    if (fromNativeRequest.isOkay()) {
      expect(fromNativeRequest.value.url).toBe("https://example.com/c");
      expect(fromNativeRequest.value.method).toBe("PUT");

      const fromSigurRequest = Request.from(fromNativeRequest.value);

      if (fromSigurRequest.isOkay()) {
        expect(fromSigurRequest.value.url).toBe("https://example.com/c");
        expect(fromSigurRequest.value.method).toBe("PUT");
        expect(unwrap<globalThis.Request>(fromSigurRequest.value)).not.toBe(
          unwrap<globalThis.Request>(fromNativeRequest.value),
        );
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("from returns err for invalid input", () => {
    const result = Request.from("not a url");

    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(TypeError);
    } else {
      expect.unreachable();
    }
  });

  it("getters match the native Request", () => {
    const result = Request.from("https://example.com/item", {
      method: "PATCH",
      headers: { "content-type": "text/plain" },
      body: "payload",
      duplex: "half",
    } as RequestInit);

    if (result.isOkay()) {
      const request = result.value;
      const native = unwrap<globalThis.Request>(request);

      expect(request.url).toBe(native.url);
      expect(request.method).toBe(native.method);
      expect(request.headers).toBeInstanceOf(Headers);
      expect(unwrap<globalThis.Headers>(request.headers)).toBe(native.headers);
      expect(request.headers.get("content-type")).toBe("text/plain");
      expect(request.bodyUsed).toBe(native.bodyUsed);
      expect(request.cache).toBe(native.cache);
      expect(request.credentials).toBe(native.credentials);
      expect(request.destination).toBe(native.destination);
      expect(request.integrity).toBe(native.integrity);
      expect(request.keepalive).toBe(native.keepalive);
      expect(request.mode).toBe(native.mode);
      expect(request.redirect).toBe(native.redirect);
      expect(request.referrer).toBe(native.referrer);
      expect(request.referrerPolicy).toBe(native.referrerPolicy);
      expect(request.signal).toBe(native.signal);
      expect(request.duplex).toBe("half");
    } else {
      expect.unreachable();
    }
  });

  it("text and json body readers return ok Results", async () => {
    const textRequest = Request.from("https://example.com", {
      method: "POST",
      body: "hello",
    });

    if (textRequest.isOkay()) {
      const textResult = await textRequest.value.text();

      if (textResult.isOkay()) {
        expect(textResult.value).toBe("hello");
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }

    const jsonRequest = Request.from("https://example.com", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true }),
    });

    if (jsonRequest.isOkay()) {
      const jsonResult = await jsonRequest.value.json();

      if (jsonResult.isOkay()) {
        expect(jsonResult.value).toEqual({ ok: true });
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("bytes returns a Uint8Array Result", async () => {
    const result = Request.from("https://example.com", {
      method: "POST",
      body: "abc",
    });

    if (result.isOkay()) {
      const bytes = await result.value.bytes();

      if (bytes.isOkay()) {
        expect(bytes.value).toBeInstanceOf(Uint8Array);
        expect(new TextDecoder().decode(bytes.value)).toBe("abc");
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("arrayBuffer, blob, and formData body readers return ok Results", async () => {
    const arrayBufferRequest = Request.from("https://example.com", {
      method: "POST",
      body: "buf",
    });

    if (arrayBufferRequest.isOkay()) {
      const buffer = await arrayBufferRequest.value.arrayBuffer();

      if (buffer.isOkay()) {
        expect(buffer.value).toBeInstanceOf(ArrayBuffer);
        expect(new TextDecoder().decode(buffer.value)).toBe("buf");
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }

    const blobRequest = Request.from("https://example.com", {
      method: "POST",
      body: "blob-body",
    });

    if (blobRequest.isOkay()) {
      const blob = await blobRequest.value.blob();

      if (blob.isOkay()) {
        expect(blob.value).toBeInstanceOf(Blob);
        expect(await blob.value.text()).toBe("blob-body");
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }

    const form = new FormData();
    form.set("name", "sigur");

    const formDataRequest = Request.from("https://example.com", {
      method: "POST",
      body: form,
    });

    if (formDataRequest.isOkay()) {
      const formData = await formDataRequest.value.formData();

      if (formData.isOkay()) {
        expect(formData.value).toBeInstanceOf(FormData);
        expect(formData.value.get("name")).toBe("sigur");
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("body readers return err when the body is already used", async () => {
    const result = Request.from("https://example.com", {
      method: "POST",
      body: "once",
    });

    if (result.isOkay()) {
      const first = await result.value.text();
      expect(first.isOkay()).toBe(true);

      const second = await result.value.text();

      if (second.isErr()) {
        expect(second.error).toBeInstanceOf(TypeError);
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("clone returns ok then err after the body is used", async () => {
    const result = Request.from("https://example.com", {
      method: "POST",
      body: "clone-me",
    });

    if (result.isOkay()) {
      const cloned = result.value.clone();

      if (cloned.isOkay()) {
        expect(cloned.value).toBeInstanceOf(Request);
        expect(unwrap<globalThis.Request>(cloned.value)).not.toBe(
          unwrap<globalThis.Request>(result.value),
        );

        const text = await cloned.value.text();
        expect(text.isOkay()).toBe(true);
      } else {
        expect.unreachable();
      }

      const afterRead = await result.value.text();
      expect(afterRead.isOkay()).toBe(true);

      const cloneAfterUse = result.value.clone();

      if (cloneAfterUse.isErr()) {
        expect(cloneAfterUse.error).toBeInstanceOf(TypeError);
      } else {
        expect.unreachable();
      }
    } else {
      expect.unreachable();
    }
  });

  it("textStream forwards when present on the native instance", () => {
    const stream = new ReadableStream<Uint8Array>();

    vi.stubGlobal(
      "Request",
      class {
        textStream() {
          return stream;
        }
      },
    );

    const result = Request.from("https://example.com");

    if (result.isOkay()) {
      expect(result.value.textStream()).toBe(stream);
    } else {
      expect.unreachable();
    }
  });

  it("constructs through globalThis.Request", () => {
    const RealRequest = globalThis.Request;
    const stub = vi.fn((input: RequestInfo, init?: RequestInit) => new RealRequest(input, init));

    vi.stubGlobal("Request", stub);

    const result = Request.from("https://example.com/stubbed", { method: "DELETE" });

    expect(stub).toHaveBeenCalledWith("https://example.com/stubbed", {
      method: "DELETE",
    });

    if (result.isOkay()) {
      expect(result.value.method).toBe("DELETE");
      expect(result.value.url).toBe("https://example.com/stubbed");
    } else {
      expect.unreachable();
    }
  });
});
