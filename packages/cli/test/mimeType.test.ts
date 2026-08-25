import { describe, it, expect } from "vitest";
import { mimeTypeForPath } from "../src/mimeType.js";

describe("mimeTypeForPath", () => {
  it.each([
    ["photo.png", "image/png"],
    ["photo.PNG", "image/png"],
    ["photo.jpg", "image/jpeg"],
    ["photo.jpeg", "image/jpeg"],
    ["photo.gif", "image/gif"],
    ["photo.webp", "image/webp"],
    ["/some/dir/screenshot.PNG", "image/png"],
  ])("maps %s to %s", (path, expected) => {
    expect(mimeTypeForPath(path)).toBe(expected);
  });

  it("throws a helpful error for an unsupported extension", () => {
    expect(() => mimeTypeForPath("document.pdf")).toThrow(/unsupported image extension/);
  });

  it("throws for a file with no extension", () => {
    expect(() => mimeTypeForPath("noext")).toThrow(/unsupported image extension/);
  });
});
