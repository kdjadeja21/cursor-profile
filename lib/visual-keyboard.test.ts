import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isEditableTarget,
  isSoftwareKeyboardCovering,
  isVisualKeyboardOpen,
  nextLayoutRestingSize,
  visualKeyboardInset,
  type SoftwareKeyboardGeometry,
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

function geometry(
  overrides: Partial<SoftwareKeyboardGeometry>,
): SoftwareKeyboardGeometry {
  return {
    innerHeight: 844,
    viewportHeight: 844,
    viewportOffsetTop: 0,
    layoutBaseline: 844,
    coarsePointer: true,
    editableFocused: false,
    ...overrides,
  };
}

describe("nextLayoutRestingSize", () => {
  const resting = { height: 844, width: 390 };

  it("follows the layout while nothing is focused", () => {
    assert.deepEqual(
      nextLayoutRestingSize(resting, {
        height: 760,
        width: 390,
        editableFocused: false,
      }),
      { height: 760, width: 390 },
    );
  });

  it("keeps the pre-keyboard height when a field is focused and the layout shrinks", () => {
    assert.deepEqual(
      nextLayoutRestingSize(resting, {
        height: 420,
        width: 390,
        editableFocused: true,
      }),
      resting,
    );
  });

  it("resets when the width changes, as on rotation", () => {
    assert.deepEqual(
      nextLayoutRestingSize(resting, {
        height: 390,
        width: 844,
        editableFocused: true,
      }),
      { height: 390, width: 844 },
    );
  });
});

describe("isSoftwareKeyboardCovering", () => {
  it("stays closed when a phone field is focused but the viewport did not shrink", () => {
    assert.equal(
      isSoftwareKeyboardCovering(
        geometry({ editableFocused: true, coarsePointer: true }),
      ),
      false,
    );
  });

  it("opens when the visual viewport leaves a keyboard-sized gap", () => {
    assert.equal(
      isSoftwareKeyboardCovering(
        geometry({
          viewportHeight: 500,
          editableFocused: true,
        }),
      ),
      true,
    );
  });

  it("opens when iOS scrolls the visual viewport over the keyboard", () => {
    assert.equal(
      isSoftwareKeyboardCovering(
        geometry({
          innerHeight: 800,
          viewportHeight: 500,
          viewportOffsetTop: 300,
          editableFocused: true,
        }),
      ),
      true,
    );
  });

  it("opens when resizes-content shrinks the layout viewport instead", () => {
    assert.equal(
      isSoftwareKeyboardCovering(
        geometry({
          innerHeight: 420,
          viewportHeight: 420,
          layoutBaseline: 844,
          editableFocused: true,
          coarsePointer: true,
        }),
      ),
      true,
    );
  });

  it("closes again after that shrink is gone, even if the field stays focused", () => {
    assert.equal(
      isSoftwareKeyboardCovering(
        geometry({
          innerHeight: 844,
          viewportHeight: 844,
          layoutBaseline: 844,
          editableFocused: true,
          coarsePointer: true,
        }),
      ),
      false,
    );
  });

  it("ignores a desktop window resize while a field is focused", () => {
    assert.equal(
      isSoftwareKeyboardCovering(
        geometry({
          innerHeight: 500,
          viewportHeight: 500,
          layoutBaseline: 844,
          editableFocused: true,
          coarsePointer: false,
        }),
      ),
      false,
    );
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
