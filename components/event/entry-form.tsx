"use client";

import { useId, useRef, useState } from "react";
import { MagneticButton } from "@/components/fx/magnetic";
import { GsapSwap } from "@/components/fx/gsap-swap";
import { takeSurpriseHandle } from "@/lib/surprise-bag";
import { cx } from "@/lib/cx";

type SubmitState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "error"; message: string };

async function submitClaim(
  payload: { username: string } | { random: true; username?: string },
): Promise<{ ok: true; username: string } | { ok: false; message: string }> {
  try {
    const response = await fetch("/event/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body: unknown = await response.json().catch(() => null);
    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

    if (!response.ok) {
      const message =
        typeof record.error === "string" ? record.error : "Something went wrong. Try again.";
      return { ok: false, message };
    }

    const profile = record.profile as { profile?: { handle?: string } } | undefined;
    const username =
      typeof record.username === "string"
        ? record.username
        : profile?.profile?.handle ?? "";

    return { ok: true, username };
  } catch {
    return { ok: false, message: "Couldn't reach the spotlight. Check your connection." };
  }
}

async function fireSuccessConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const { default: confetti } = await import("canvas-confetti");
  confetti({
    particleCount: 90,
    spread: 90,
    startVelocity: 42,
    gravity: 0.9,
    ticks: 200,
    scalar: 1.1,
    colors: ["#f54e00", "#ff7a3d", "#ffb347", "#f7f5f2"],
    origin: { y: 0.55 },
    disableForReducedMotion: true,
  });
}

export function EntryForm({
  hasSurprise,
  onClaimed,
  onSettled,
}: {
  hasSurprise: boolean;
  onClaimed: (username: string) => void;
  onSettled: () => void;
}) {
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [handle, setHandle] = useState("");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  const pending = state.kind === "pending";
  const error = state.kind === "error" ? state.message : null;

  const runClaim = async (
    payload: { username: string } | { random: true; username?: string },
  ) => {
    setState({ kind: "pending" });
    const result = await submitClaim(payload);

    if (result.ok) {
      onClaimed(result.username);
      void fireSuccessConfetti();
    } else {
      setState({ kind: "error", message: result.message });
    }

    onSettled();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = handle.trim().replace(/^@+/, "");
    if (!trimmed) {
      setState({ kind: "error", message: "Enter a username to begin." });
      return;
    }
    void runClaim({ username: trimmed });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-6 text-center"
    >
      <div
        className={cx(
          "glass flex w-full flex-col items-stretch gap-3 rounded-3xl p-3 transition-[box-shadow,border-color] duration-500 sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:py-2 sm:pr-2 sm:pl-7",
          !error && "border-accent/40",
          error &&
            "border-danger bg-danger/10 shadow-[0_0_70px_-8px_var(--color-danger),inset_0_0_40px_-20px_var(--color-danger)]",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3 sm:px-0">
          <span aria-hidden="true" className="text-title text-ink-faint font-semibold">
            @
          </span>
          <label htmlFor={inputId} className="sr-only">
            Cursor username
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="your-username"
            value={handle}
            readOnly={pending}
            aria-invalid={error !== null}
            aria-describedby={errorId}
            onChange={(event) => {
              setHandle(event.target.value);
              if (state.kind === "error") {
                setState({ kind: "idle" });
              }
            }}
            className="text-title text-ink placeholder:text-ink-faint/60 min-w-0 flex-1 bg-transparent py-3 font-semibold outline-none"
          />
        </div>
        <MagneticButton
          type="submit"
          size="lg"
          disabled={pending}
          className={cx("w-full shrink-0 sm:w-auto", pending && "disabled:opacity-100 shimmer-auto")}
        >
          {pending ? "Claiming…" : "Take the stage"}
        </MagneticButton>
      </div>

      {hasSurprise ? (
        <MagneticButton
          type="button"
          variant="ghost"
          size="lg"
          disabled={pending}
          onClick={() => {
            const username = takeSurpriseHandle();
            if (!username) {
              setState({
                kind: "error",
                message: "Surprise Me isn't available right now.",
              });
              return;
            }
            void runClaim({ random: true, username });
          }}
        >
          Surprise me
          <span aria-hidden="true">✦</span>
        </MagneticButton>
      ) : null}

      <div className="relative h-[1.6em] w-full">
        <GsapSwap id={error ?? (pending ? "pending" : "hint")} className="absolute inset-x-0">
          <p
            id={errorId}
            role={error ? "alert" : undefined}
            className={cx("text-base", error ? "text-danger-text" : "text-ink-faint")}
          >
            {error ?? "No profile? Try Surprise Me instead."}
          </p>
        </GsapSwap>
      </div>
    </form>
  );
}
