import { describe, it, expect } from "vitest";
import {
  sanitizeJsonForScript,
  sanitizeInlineSvg,
  sanitizeInput,
  sanitizeQueryParam,
  escapeHtml,
  stripHtml,
  sanitizeFormData,
} from "@/lib/security/sanitize";

describe("sanitize security utilities", () => {
  describe("sanitizeJsonForScript", () => {
    it("escapes angle brackets and ampersand in stringified JSON", () => {
      const input = { msg: "<script>alert(1)</script> & more" };
      const result = sanitizeJsonForScript(input);
      expect(result).toBe('{"msg":"\\u003cscript\\u003ealert(1)\\u003c/script\\u003e \\u0026 more"}');
    });

    it("returns JSON without changes when no special chars present", () => {
      const input = { safe: "hello world 123", num: 42 };
      const result = sanitizeJsonForScript(input);
      expect(result).toBe('{"safe":"hello world 123","num":42}');
    });

    it("handles array input and null/undefined values", () => {
      const input = [null, "a<b>c", undefined];
      const result = sanitizeJsonForScript(input);
      expect(result).toBe('[null,"a\\u003cb\\u003ec",null]');
    });

    it("escapes in nested structures", () => {
      const input = { html: "<div>&</div>" };
      const result = sanitizeJsonForScript(input);
      expect(result).toContain("\\u003cdiv\\u003e");
      expect(result).toContain("\\u0026");
    });
  });

  describe("sanitizeInlineSvg", () => {
    it("returns input unchanged when no script or handlers present", () => {
      const svg = '<svg><rect x="0" y="0" width="10" height="10"/></svg>';
      expect(sanitizeInlineSvg(svg)).toBe(svg);
    });

    it("removes script tags and their contents", () => {
      const svg = '<svg><script>evil()</script><circle/></svg>';
      const result = sanitizeInlineSvg(svg);
      expect(result).not.toContain("<script");
      expect(result).not.toContain("evil()");
      expect(result).toContain("<circle/>");
    });

    it("removes self-closing script and foreignObject nodes", () => {
      const svg =
        '<svg><script src="evil.js"/><foreignObject width="1" height="1"/><circle/></svg>';
      const result = sanitizeInlineSvg(svg);
      expect(result).not.toContain("<script");
      expect(result).not.toContain("foreignObject");
      expect(result).toContain("<circle/>");
    });

    it("removes paired foreignObject hosts", () => {
      const svg =
        '<svg><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><script>x()</script></body></foreignObject><rect/></svg>';
      const result = sanitizeInlineSvg(svg);
      expect(result).not.toContain("foreignObject");
      expect(result).not.toContain("<script");
      expect(result).toContain("<rect/>");
    });

    it("removes inline event handlers with double quotes", () => {
      const svg = '<svg><rect onclick="doBad()" /></svg>';
      const result = sanitizeInlineSvg(svg);
      expect(result).not.toContain("onclick");
      expect(result).not.toContain("doBad");
      expect(result).toContain("<rect ");
    });

    it("removes inline event handlers with single quotes", () => {
      const svg = "<svg><g onmouseover='bad()'></g></svg>";
      const result = sanitizeInlineSvg(svg);
      expect(result).not.toContain("onmouseover");
      expect(result).not.toContain("bad()");
    });

    it("removes inline event handlers without quotes", () => {
      const svg = '<svg><path onfocus=alert(1) /></svg>';
      const result = sanitizeInlineSvg(svg);
      expect(result).not.toContain("onfocus");
      expect(result).not.toContain("alert(1)");
    });

    it("removes javascript: protocol references", () => {
      const svg = '<svg><a href="javascript:evil()"/></svg>';
      const result = sanitizeInlineSvg(svg);
      expect(result).not.toContain("javascript:");
      expect(result).toContain('href="');
    });

    it("handles empty string and multiple issues combined", () => {
      expect(sanitizeInlineSvg("")).toBe("");
      const dirty = '<svg><script>/* */</script><rect onclick="x()" onfoo=bar href="javascript:void(0)"/></svg>';
      const clean = sanitizeInlineSvg(dirty);
      expect(clean).not.toContain("<script");
      expect(clean).not.toContain("onclick");
      expect(clean).not.toContain("onfoo");
      expect(clean).not.toContain("javascript:");
    });
  });

  describe("sanitizeInput", () => {
    it("strips script tags and executable contents", () => {
      const dirty = "Hello <script>alert('xss')</script>World";
      expect(sanitizeInput(dirty)).toBe("Hello World");
    });

    it("strips iframe and style tags", () => {
      const dirty = 'Before <iframe src="evil.com"></iframe><style>body{color:red}</style>After';
      expect(sanitizeInput(dirty)).toBe("Before After");
    });

    it("strips general HTML tags", () => {
      const dirty = "<b>Bold</b> and <i>italic</i> <a href='link'>link</a>";
      expect(sanitizeInput(dirty)).toBe("Bold and italic link");
    });

    it("strips null bytes and dangerous control characters", () => {
      const dirty = "safe\0string\x08with\x1Fcontrol";
      expect(sanitizeInput(dirty)).toBe("safestringwithcontrol");
    });

    it("enforces maximum length truncation", () => {
      const longStr = "a".repeat(100);
      expect(sanitizeInput(longStr, 20)).toBe("a".repeat(20));
    });

    it("handles non-string inputs gracefully", () => {
      expect(sanitizeInput(null)).toBe("");
      expect(sanitizeInput(undefined)).toBe("");
      expect(sanitizeInput(123)).toBe("");
    });
  });

  describe("sanitizeQueryParam", () => {
    it("sanitizes query parameters with default limit", () => {
      const dirty = "search <script>evil()</script> term";
      expect(sanitizeQueryParam(dirty)).toBe("search term");
    });
  });

  describe("escapeHtml", () => {
    it("escapes all dangerous HTML characters", () => {
      expect(escapeHtml('<script>alert("XSS") & \'foo\' /</script>')).toBe(
        "&lt;script&gt;alert(&quot;XSS&quot;) &amp; &#x27;foo&#x27; &#x2F;&lt;&#x2F;script&gt;",
      );
    });
  });

  describe("stripHtml", () => {
    it("removes all markup and collapses extra whitespace", () => {
      expect(stripHtml("<h1> Title </h1> \n <p> Content here </p>")).toBe(
        "Title Content here",
      );
    });
  });

  describe("sanitizeFormData", () => {
    it("recursively sanitizes string fields in nested form data", () => {
      const form = {
        name: "Alice <script>xss</script>",
        company: "Acme <b>Corp</b>",
        count: 5,
        details: {
          note: "Important <iframe src='evil'></iframe> note",
        },
        tags: ["tag1 <script>", "tag2"],
      };
      const clean = sanitizeFormData(form);
      expect(clean.name).toBe("Alice");
      expect(clean.company).toBe("Acme Corp");
      expect(clean.count).toBe(5);
      expect(clean.details.note).toBe("Important note");
      expect(clean.tags).toEqual(["tag1", "tag2"]);
    });
  });
});

