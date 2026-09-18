"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { parseHandleInput } from "@/lib/handle";
import { cx } from "@/lib/cx";

const HANDLE_PATTERN = /^[a-zA-Z0-9._-]{1,39}$/;

type GateError = "empty" | "invalid" | "not-found" | "unavailable";

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

export function HandleGate() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState("");
  const [error, setError] = useState<GateError | null>(null);
  const [shaking, setShaking] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const shake = () => {
    if (reduced) {
      return;
    }

    setShaking(false);
    requestAnimationFrame(() => setShaking(true));
  };

  const fail = (kind: GateError) => {
    setError(kind);
    setPending(false);
    shake();
    inputRef.current?.focus();
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const handle = parseHandleInput(value);
    if (!handle) {
      fail("empty");
      return;
    }

    if (!HANDLE_PATTERN.test(handle)) {
      fail("invalid");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });

      if (response.status === 404) {
        fail("not-found");
        return;
      }

      if (!response.ok) {
        fail("unavailable");
        return;
      }

      router.push(`/@${handle}`);
    } catch {
      fail("unavailable");
    }
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
        onSubmit={onSubmit}
        className="relative flex w-full max-w-xl flex-col items-center text-center"
      >
        <p className="text-ink-faint text-micro mb-5 tracking-[0.28em] uppercase">
          Cursor ambassadors
        </p>
        <h1 className="text-display sm:text-hero text-ink">Whose year is it?</h1>
        <p className="text-ink-muted text-lead mt-4 max-w-md">
          Type a handle. The highlight reel plays itself.
        </p>

        <div
          className={cx(
            "border-edge-strong bg-surface-raised mt-10 flex w-full items-center rounded-2xl border px-4 py-2 has-[:focus-visible]:border-accent/70",
            error && "border-danger/70",
            shaking && "animate-[shake_0.46s_ease-in-out]",
          )}
          onAnimationEnd={() => setShaking(false)}
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
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="kdjadeja"
            value={value}
            disabled={pending}
            aria-invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) {
                setError(null);
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
            error ? "text-danger" : "text-ink-faint",
          )}
        >
          {error ? errorCopy(error) : "Public profiles only."}
        </p>
      </form>
    </main>
  );
}
