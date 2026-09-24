import { describe, expect, it } from "vitest";
import {
  decodeURI,
  decodeURIComponent,
  encodeURI,
  encodeURIComponent,
} from "../src/builtins/uri.ts";

describe("URI", () => {
  it("decodeURI ok / err", () => {
    const okResult = decodeURI("https://example.com/a%20b");

    if (okResult.isOkay()) {
      expect(okResult.value).toBe("https://example.com/a b");
    } else {
      expect.unreachable();
    }

    const errResult = decodeURI("%E0%A4%A");

    if (errResult.isNotOkay()) {
      expect(errResult.error).toBeInstanceOf(URIError);
    } else {
      expect.unreachable();
    }
  });

  it("decodeURIComponent ok / err", () => {
    const okResult = decodeURIComponent("a%20b");

    if (okResult.isOkay()) {
      expect(okResult.value).toBe("a b");
    } else {
      expect.unreachable();
    }

    const errResult = decodeURIComponent("%E0%A4%A");

    if (errResult.isNotOkay()) {
      expect(errResult.error).toBeInstanceOf(URIError);
    } else {
      expect.unreachable();
    }
  });

  it("encodeURI ok / err", () => {
    const okResult = encodeURI("https://example.com/a b");

    if (okResult.isOkay()) {
      expect(okResult.value).toBe("https://example.com/a%20b");
    } else {
      expect.unreachable();
    }

    const errResult = encodeURI("\uD800");

    if (errResult.isNotOkay()) {
      expect(errResult.error).toBeInstanceOf(URIError);
    } else {
      expect.unreachable();
    }
  });

  it("encodeURIComponent ok / err", () => {
    const okResult = encodeURIComponent("a b");

    if (okResult.isOkay()) {
      expect(okResult.value).toBe("a%20b");
    } else {
      expect.unreachable();
    }

    const errResult = encodeURIComponent("\uD800");

    if (errResult.isNotOkay()) {
      expect(errResult.error).toBeInstanceOf(URIError);
    } else {
      expect.unreachable();
    }
  });
});
