"use client";

import { useId, useRef, useState } from "react";
import { MagneticButton } from "@/components/fx/magnetic";
import { GsapSwap } from "@/components/fx/gsap-swap";
import { useMood } from "@/lib/use-mood";
import { cx } from "@/lib/cx";

type ClaimSuccess = {
  username: string;
  displayName: string;
  isRandom: boolean;
};

type SubmitState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; data: ClaimSuccess }
  | { kind: "error"; message: string };

async function submitClaim(
  payload: { username: string } | { random: true },
): Promise<{ ok: true; data: ClaimSuccess } | { ok: false; message: string }> {
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

    const profile = record.profile as { handle?: string; displayName?: string } | undefined;

    return {
      ok: true,
      data: {
        username: typeof record.username === "string" ? record.username : profile?.handle ?? "",
        displayName: profile?.displayName ?? profile?.handle ?? "",
        isRandom: record.isRandom === true,
      },
    };
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
    origin: { y: 0.65 },
    disableForReducedMotion: true,
  });
}

export function EntryForm({ hasSurprise }: { hasSurprise: boolean }) {
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [handle, setHandle] = useState("");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  useMood("idle");

  const pending = state.kind === "pending";

  const runClaim = async (payload: { username: string } | { random: true }) => {
    setState({ kind: "pending" });
    const result = await submitClaim(payload);

    if (result.ok) {
      setState({ kind: "success", data: result.data });
      void fireSuccessConfetti();
    } else {
      setState({ kind: "error", message: result.message });
    }
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

  const tryAgain = () => {
    setState({ kind: "idle" });
    inputRef.current?.focus();
  };

  if (state.kind === "success") {
    const { data } = state;
    return (
      <div
        role="status"
        className="glass shimmer shimmer-auto border-accent/50 shadow-glow flex w-full max-w-lg flex-col items-center gap-3 rounded-3xl p-8 text-center"
      >
        <span aria-hidden="true" className="text-3xl">
          ✦
        </span>
        <p className="text-accent text-heading font-bold">You&rsquo;re up!</p>
        <p className="text-ink-muted text-base">
          {data.displayName || `@${data.username}`} is live on the main screen for the next
          60 seconds.
        </p>
        <MagneticButton type="button" variant="ghost" onClick={tryAgain} className="mt-3">
          Spotlight someone else
        </MagneticButton>
      </div>
    );
  }

  const error = state.kind === "error" ? state.message : null;

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
          onClick={() => void runClaim({ random: true })}
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
