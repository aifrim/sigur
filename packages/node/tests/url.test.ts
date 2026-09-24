import { describe, expect, it } from "vitest";
import { unwrap } from "../src/builtins/inner.ts";
import { URL } from "../src/builtins/url.ts";
import { URLSearchParams } from "../src/builtins/url-search-params.ts";

describe("URL", () => {
  it("from constructs an absolute URL", () => {
    const result = URL.from("https://example.com/path");

    if (result.isOkay()) {
      expect(result.value).toBeInstanceOf(URL);
      expect(result.value.href).toBe("https://example.com/path");
      expect(unwrap<globalThis.URL>(result.value)).toBeInstanceOf(globalThis.URL);
    } else {
      expect.unreachable();
    }
  });

  it("from constructs a URL with a base", () => {
    const result = URL.from("/path", "https://example.com");

    if (result.isOkay()) {
      expect(result.value.href).toBe("https://example.com/path");
    } else {
      expect.unreachable();
    }
  });

  it("from returns err for garbage input", () => {
    const result = URL.from("not a url");

    if (result.isNotOkay()) {
      expect(result.error).toBeInstanceOf(TypeError);
    } else {
      expect.unreachable();
    }
  });

  it("parse returns ok for a valid URL", () => {
    const result = URL.parse("https://example.com/path");

    if (result.isOkay()) {
      expect(result.value).toBeInstanceOf(URL);
      expect(result.value.href).toBe("https://example.com/path");
    } else {
      expect.unreachable();
    }
  });

  it("parse returns Invalid URL when native parse yields null", () => {
    const result = URL.parse("not a url");

    if (result.isNotOkay()) {
      expect(result.error).toBeInstanceOf(TypeError);
      expect(result.error.message).toBe("Invalid URL");
    } else {
      expect.unreachable();
    }
  });

  it("setters update href like native", () => {
    const result = URL.from("https://example.com/path");

    if (result.isOkay()) {
      const url = result.value;
      url.hash = "tabby";
      url.pathname = "/animals/cats";

      expect(url.hash).toBe("#tabby");
      expect(url.pathname).toBe("/animals/cats");
      expect(url.href).toBe("https://example.com/animals/cats#tabby");
    } else {
      expect.unreachable();
    }
  });

  it("setting href to an invalid absolute URL throws", () => {
    const result = URL.from("https://example.com/");

    if (result.isOkay()) {
      expect(() => {
        result.value.href = "not a url";
      }).toThrow(TypeError);
    } else {
      expect.unreachable();
    }
  });

  it("canParse reports valid and invalid input", () => {
    expect(URL.canParse("https://example.com/path")).toBe(true);
    expect(URL.canParse("/path", "https://example.com")).toBe(true);
    expect(URL.canParse("not a url")).toBe(false);
  });

  it("createObjectURL and revokeObjectURL round-trip a Blob", () => {
    const blob = new Blob(["hello"], { type: "text/plain" });
    const created = URL.createObjectURL(blob);

    if (created.isOkay()) {
      expect(created.value).toMatch(/^blob:/);
      URL.revokeObjectURL(created.value);
    } else {
      expect.unreachable();
    }
  });

  it("searchParams is a live sigur URLSearchParams wrapper", () => {
    const result = URL.from("https://example.com?x=1");

    if (result.isOkay()) {
      const url = result.value;
      const params = url.searchParams;

      expect(params).toBeInstanceOf(URLSearchParams);
      expect(unwrap<globalThis.URLSearchParams>(params)).toBe(
        unwrap<globalThis.URL>(url).searchParams,
      );
      expect(params.get("x")).toBe("1");

      params.set("y", "2");
      params.append("x", "3");

      expect(url.search).toBe("?x=1&y=2&x=3");
      expect(url.href).toBe("https://example.com/?x=1&y=2&x=3");
    } else {
      expect.unreachable();
    }
  });
});
