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
