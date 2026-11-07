import { describe, expect, it } from "vitest";
import { previewCreateTemplate } from "./templateFlags";

describe("template flags", () => {
  it("refuses a template that can neither move nor burn", () => {
    expect(previewCreateTemplate(false, false)).toEqual({
      ok: false,
      reason: "A template cannot be both non-transferable and non-burnable",
    });
  });

  it("allows every other flag pair", () => {
    expect(previewCreateTemplate(true, true).ok).toBe(true);
    expect(previewCreateTemplate(true, false).ok).toBe(true);
    expect(previewCreateTemplate(false, true).ok).toBe(true);
  });
});
