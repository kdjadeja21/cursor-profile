"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "motion/react";
import {
  playProfile,
  type GateError,
  type GateState,
} from "@/app/play-profile";
import { cx } from "@/lib/cx";

function errorCopy(kind: GateError): string {
  switch (kind) {
    case "empty":
      return "Enter a username to begin.";
    case "invalid":
      return "Usernames can only use letters, numbers, dots, hyphens and underscores.";
    case "not-found":
      return "User profile not found.";
    case "unavailable":
      return "Couldn’t reach that profile. Try again in a moment.";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

export function HandleGate({
  initialHandle = "",
  initialError = null,
}: {
  initialHandle?: string;
  initialError?: GateError | null;
}) {
  const reduced = useReducedMotion();
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState<GateState, FormData>(
    playProfile,
    { error: initialError },
  );
  const [dismissed, setDismissed] = useState(false);
  const error = pending || dismissed ? null : state.error;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submitAction = (formData: FormData) => {
    setDismissed(false);
    return formAction(formData);
  };

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(52% 48% at 50% 42%, color-mix(in srgb, var(--color-accent) 16%, transparent), transparent 72%)",
        }}
      />

      <form
        action={submitAction}
        className="relative flex w-full max-w-xl flex-col items-center text-center"
      >
        <Image
          src="/cursor-lockup.svg"
          alt="Cursor"
          width={220}
          height={53}
          priority
          className="mb-8 h-12 w-auto sm:h-14"
        />
        <h1 className="text-display sm:text-hero text-ink">Whose year is it?</h1>

        <div
          className={cx(
            "border-edge-strong bg-surface-raised mt-10 flex w-full items-center rounded-2xl border px-4 py-2 has-[:focus-visible]:border-accent/70",
            error && "border-danger/70",
            error && !reduced && "animate-[shake_0.46s_ease-in-out]",
          )}
        >
          <span aria-hidden="true" className="text-ink-faint text-title pr-1">
            @
          </span>
          <label htmlFor={inputId} className="sr-only">
            Username
          </label>
          <input
            ref={inputRef}
            id={inputId}
            name="handle"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="kdjadeja"
            defaultValue={initialHandle}
            disabled={pending}
            aria-invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            onChange={() => {
              if (error) {
                setDismissed(true);
              }
            }}
            className="text-title text-ink placeholder:text-ink-faint min-w-0 flex-1 bg-transparent py-3 outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="bg-accent text-surface focus-visible:ring-ink text-small shrink-0 rounded-full px-5 py-2.5 transition-transform outline-none hover:scale-[1.03] focus-visible:ring-2 disabled:opacity-60"
          >
            {pending ? "Looking…" : "Play"}
          </button>
        </div>

        <p
          id={errorId}
          role="alert"
          className={cx(
            "text-small mt-4 min-h-[1.5em]",
            error ? "text-danger-text" : "text-ink-faint",
          )}
        >
          {error ? errorCopy(error) : "Public profiles only."}
        </p>
      </form>
    </main>
  );
}
