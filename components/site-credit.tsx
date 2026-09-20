"use client";

import { useEffect } from "react";
import { useVisualKeyboardOpen } from "@/lib/use-visual-keyboard";
import { cx } from "@/lib/cx";

const NAME_HREF = "https://linktr.ee/krushnasinh";
const CURSOR_HREF = "https://cursor.com/";

function CreditLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-ink-muted hover:text-ink focus-visible:ring-ink rounded-sm underline-offset-4 transition-colors hover:underline focus-visible:ring-2 focus-visible:outline-none"
    >
      {children}
    </a>
  );
}

/** App-wide credit. Fixed so the home gate and the recap share the same line. */
export function SiteCredit() {
  const keyboardOpen = useVisualKeyboardOpen();

  useEffect(() => {
    const root = document.documentElement;
    if (keyboardOpen) {
      root.dataset.keyboard = "";
    } else {
      delete root.dataset.keyboard;
    }
    return () => {
      delete root.dataset.keyboard;
    };
  }, [keyboardOpen]);

  return (
    <footer
      aria-hidden={keyboardOpen}
      className={cx(
        "pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 py-3",
        keyboardOpen && "hidden",
      )}
    >
      <p className="text-ink-faint text-micro flex flex-wrap items-center justify-center gap-x-2 gap-y-1 tracking-[0.22em] uppercase">
        <span className="pointer-events-auto">
          Crafted by <CreditLink href={NAME_HREF}>Krushnasinh Jadeja</CreditLink>
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <span aria-hidden="true">🇮🇳</span> India
        </span>
        <span aria-hidden="true">·</span>
        <span className="pointer-events-auto">
          Built with <CreditLink href={CURSOR_HREF}>Cursor</CreditLink>
        </span>
      </p>
    </footer>
  );
}
