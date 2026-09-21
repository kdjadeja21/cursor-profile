/** Pixels of visual-viewport shrink we treat as a software keyboard. */
export const VISUAL_KEYBOARD_INSET_PX = 80;

export function visualKeyboardInset(
  innerHeight: number,
  viewportHeight: number,
  viewportOffsetTop: number,
): number {
  return Math.max(0, innerHeight - viewportHeight - viewportOffsetTop);
}

export function isVisualKeyboardOpen(inset: number): boolean {
  return inset > VISUAL_KEYBOARD_INSET_PX;
}

export type LayoutRestingSize = {
  height: number;
  width: number;
};

/** Last layout size that was not caused by the software keyboard. */
export function nextLayoutRestingSize(
  resting: LayoutRestingSize,
  sample: LayoutRestingSize & { editableFocused: boolean },
): LayoutRestingSize {
  if (Math.abs(sample.width - resting.width) > VISUAL_KEYBOARD_INSET_PX) {
    return { height: sample.height, width: sample.width };
  }

  if (!sample.editableFocused || sample.height > resting.height) {
    return { height: sample.height, width: resting.width };
  }

  return resting;
}

export type SoftwareKeyboardGeometry = {
  innerHeight: number;
  viewportHeight: number | null;
  viewportOffsetTop: number;
  /** Layout height last seen before the keyboard resized the page. */
  layoutBaseline: number;
  coarsePointer: boolean;
  editableFocused: boolean;
};

/**
 * True when a software keyboard is covering the page.
 * A focused field alone is not enough: mobile browsers keep the input focused
 * after the keyboard closes, which used to leave the footer hidden until reload.
 */
export function isSoftwareKeyboardCovering(
  geometry: SoftwareKeyboardGeometry,
): boolean {
  if (geometry.viewportHeight != null) {
    const inset = visualKeyboardInset(
      geometry.innerHeight,
      geometry.viewportHeight,
      geometry.viewportOffsetTop,
    );
    if (isVisualKeyboardOpen(inset)) {
      return true;
    }
  }

  if (!geometry.editableFocused) {
    return false;
  }

  if (
    geometry.viewportHeight != null &&
    isVisualKeyboardOpen(geometry.innerHeight - geometry.viewportHeight)
  ) {
    return true;
  }

  return (
    geometry.coarsePointer &&
    isVisualKeyboardOpen(geometry.layoutBaseline - geometry.innerHeight)
  );
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (target == null || typeof target !== "object") {
    return false;
  }
  if (!("tagName" in target) || typeof target.tagName !== "string") {
    return false;
  }

  const tag = target.tagName;
  const editable =
    "isContentEditable" in target && target.isContentEditable === true;
  return (
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || editable
  );
}
