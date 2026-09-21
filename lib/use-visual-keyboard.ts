"use client";

import { useEffect, useState } from "react";
import {
  isEditableTarget,
  isSoftwareKeyboardCovering,
  nextLayoutRestingSize,
  type LayoutRestingSize,
} from "@/lib/visual-keyboard";

function coarsePointer(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

/** True while a software keyboard is covering the layout viewport. */
export function useVisualKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let resting: LayoutRestingSize = {
      height: window.innerHeight,
      width: window.innerWidth,
    };
    let settleTimer = 0;

    const read = () => {
      const editableFocused = isEditableTarget(document.activeElement);
      resting = nextLayoutRestingSize(resting, {
        height: window.innerHeight,
        width: window.innerWidth,
        editableFocused,
      });

      const viewport = window.visualViewport;
      setOpen(
        isSoftwareKeyboardCovering({
          innerHeight: window.innerHeight,
          viewportHeight: viewport?.height ?? null,
          viewportOffsetTop: viewport?.offsetTop ?? 0,
          layoutBaseline: resting.height,
          coarsePointer: coarsePointer(),
          editableFocused,
        }),
      );
    };

    const readSettled = () => {
      read();
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(read, 300);
    };

    read();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", read);
    viewport?.addEventListener("scroll", read);
    window.addEventListener("resize", read);
    window.addEventListener("focusin", readSettled);
    window.addEventListener("focusout", readSettled);
    return () => {
      window.clearTimeout(settleTimer);
      viewport?.removeEventListener("resize", read);
      viewport?.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      window.removeEventListener("focusin", readSettled);
      window.removeEventListener("focusout", readSettled);
    };
  }, []);

  return open;
}
