import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isEditableTarget,
  isVisualKeyboardOpen,
  visualKeyboardInset,
} from "./visual-keyboard.ts";

describe("visualKeyboardInset", () => {
  it("is the layout height left under the visual viewport", () => {
    assert.equal(visualKeyboardInset(800, 500, 0), 300);
  });

  it("accounts for iOS offset when the visual viewport is scrolled", () => {
    assert.equal(visualKeyboardInset(800, 500, 120), 180);
  });

  it("never goes negative", () => {
    assert.equal(visualKeyboardInset(500, 800, 0), 0);
  });
});

describe("isVisualKeyboardOpen", () => {
  it("stays closed for chrome or URL-bar jitter", () => {
    assert.equal(isVisualKeyboardOpen(40), false);
  });

  it("opens once the inset looks like a keyboard", () => {
    assert.equal(isVisualKeyboardOpen(240), true);
  });
});

describe("isEditableTarget", () => {
  it("rejects non-elements", () => {
    assert.equal(isEditableTarget(null), false);
  });

  it("accepts input-like objects without a DOM", () => {
    assert.equal(isEditableTarget({ tagName: "INPUT" } as EventTarget), true);
    assert.equal(isEditableTarget({ tagName: "DIV" } as EventTarget), false);
  });
});
