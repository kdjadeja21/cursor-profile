"use client";

import { useEffect, useState } from "react";
import {
  isEditableTarget,
  isVisualKeyboardOpen,
  visualKeyboardInset,
} from "@/lib/visual-keyboard";

function coarsePointer(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

function readKeyboardOpen(): boolean {
  const viewport = window.visualViewport;
  if (viewport) {
    const inset = visualKeyboardInset(
      window.innerHeight,
      viewport.height,
      viewport.offsetTop,
    );
    if (isVisualKeyboardOpen(inset)) {
      return true;
    }
  }

  return coarsePointer() && isEditableTarget(document.activeElement);
}

/** True while a software keyboard is covering the layout viewport. */
export function useVisualKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => {
      setOpen(readKeyboardOpen());
    };

    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("focusin", update);
    window.addEventListener("focusout", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("focusin", update);
      window.removeEventListener("focusout", update);
    };
  }, []);

  return open;
}
