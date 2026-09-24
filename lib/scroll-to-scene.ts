"use client";

import { gsap, EASE_SCROLL } from "@/lib/gsap";

const SCROLL_MIN_S = 1.2;
const SCROLL_MAX_S = 1.9;
const SCROLL_S_PER_PX = 1 / 720;

let tween: gsap.core.Tween | null = null;
let epoch = 0;

/** Bumped every time the camera is forced back to the start of a recap. */
export function sceneScrollEpoch(): number {
  return epoch;
}

export function isSceneScrolling(): boolean {
  return tween?.isActive() === true;
}

function unlockSnap() {
  delete document.documentElement.dataset.scrolling;
}

/**
 * Drop any in-flight scene tween and pin the document to the top.
 * The camera position lives on the document, so a new recap mounted while the
 * previous one was on its finale would otherwise measure that leftover offset
 * and open on the last scene.
 */
export function resetSceneScroll(): number {
  epoch += 1;
  const active = tween;
  tween = null;
  if (active) {
    active.eventCallback("onComplete", null);
    active.eventCallback("onInterrupt", null);
    active.kill();
  }

  const scroller = document.scrollingElement ?? document.documentElement;
  gsap.killTweensOf(scroller);
  unlockSnap();

  if (scroller.scrollTop !== 0) {
    scroller.scrollTop = 0;
  }
  if (document.documentElement.scrollTop !== 0) {
    document.documentElement.scrollTop = 0;
  }
  if (document.body.scrollTop !== 0) {
    document.body.scrollTop = 0;
  }

  return epoch;
}

/**
 * Scene-to-scene camera move. Duration scales with distance so a one-stop step
 * does not slam, and a long jump still arrives in under two seconds. Snap is
 * switched off for the tween so CSS proximity does not fight GSAP at the end.
 */
export function scrollToScene(id: string): Promise<void> {
  return new Promise((resolve) => {
    const target = document.getElementById(id);
    if (!target) {
      resolve();
      return;
    }

    const scroller = document.scrollingElement ?? document.documentElement;
    const y = scroller.scrollTop + target.getBoundingClientRect().top;
    const distance = Math.abs(y - scroller.scrollTop);

    if (distance < 2) {
      resolve();
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scroller.scrollTop = y;
      resolve();
      return;
    }

    const duration = Math.min(
      SCROLL_MAX_S,
      Math.max(SCROLL_MIN_S, distance * SCROLL_S_PER_PX),
    );
    const root = document.documentElement;
    root.dataset.scrolling = "";

    tween = gsap.to(scroller, {
      scrollTo: { y, autoKill: false },
      duration,
      ease: EASE_SCROLL,
      overwrite: true,
      onComplete: () => {
        tween = null;
        unlockSnap();
        resolve();
      },
      onInterrupt: () => {
        tween = null;
        unlockSnap();
        resolve();
      },
    });
  });
}
