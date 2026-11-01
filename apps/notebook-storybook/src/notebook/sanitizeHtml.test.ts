import { describe, expect, test } from "bun:test";
import { sanitizeHtml } from "./sanitizeHtml";

describe("sanitizeHtml", () => {
  test("keeps an allowlisted table and drops attributes", () => {
    expect(
      sanitizeHtml('<table class="x"><tr><td onclick="alert(1)">shell</td></tr></table>'),
    ).toBe("<table><tr><td>shell</td></tr></table>");
  });

  test("removes script blocks and unknown tags", () => {
    expect(sanitizeHtml('<script>alert(1)</script><b>ok</b><img src=x onerror=alert(1)>')).toBe(
      "<b>ok</b>",
    );
    expect(sanitizeHtml("<scr<script>ipt>alert(1)</script><em>left</em>")).toBe("<em>left</em>");
    expect(sanitizeHtml("<script>alert(1)")).toBe("");
    expect(
      sanitizeHtml('<iframe<x> srcdoc="&lt;script&gt;alert(1)&lt;/script&gt;">'),
    ).toBe("");
    expect(sanitizeHtml('<a<x> href="jav&#x61;script:alert(1)">click</a<x>>')).toBe("");
  });
});
