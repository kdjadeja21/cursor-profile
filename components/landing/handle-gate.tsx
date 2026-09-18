"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  playProfile,
  type GateError,
  type GateState,
} from "@/app/play-profile";
import { LoadingCinematic } from "@/components/fx/loading-cinematic";
import { MagneticButton } from "@/components/fx/magnetic";
import { ParticleField } from "@/components/fx/particle-field";
import { SplitText } from "@/components/fx/split-text";
import { GsapSwap } from "@/components/fx/gsap-swap";
import { gsap, useGSAP } from "@/lib/gsap";
import { parseHandleInput } from "@/lib/handle";
import { useMood } from "@/lib/use-mood";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cx } from "@/lib/cx";

const SAMPLE_HANDLES = ["kdjadeja", "your-username", "cursor-ambassador"];

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

/** Types sample handles into the empty field so the input never reads as dead space. */
function useTypewriterPlaceholder(active: boolean): string {
  const [text, setText] = useState(SAMPLE_HANDLES[0]);

  useEffect(() => {
    if (!active) {
      return;
    }

    let sample = 0;
    let length = SAMPLE_HANDLES[0].length;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const word = SAMPLE_HANDLES[sample];

      if (deleting) {
        length -= 1;
        if (length <= 0) {
          deleting = false;
          sample = (sample + 1) % SAMPLE_HANDLES.length;
        }
      } else {
        length += 1;
        if (length >= word.length) {
          deleting = true;
          setText(word);
          timer = setTimeout(tick, 2200);
          return;
        }
      }

      setText(SAMPLE_HANDLES[sample].slice(0, Math.max(0, length)));
      timer = setTimeout(tick, deleting ? 45 : 90);
    };

    timer = setTimeout(tick, 2600);
    return () => clearTimeout(timer);
  }, [active]);

  return text;
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
  const formRef = useRef<HTMLFormElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const atRef = useRef<HTMLSpanElement>(null);
  const [state, formAction, pending] = useActionState<GateState, FormData>(
    playProfile,
    { error: initialError },
  );
  const [dismissed, setDismissed] = useState(false);
  const [handle, setHandle] = useState(initialHandle);
  const [focused, setFocused] = useState(false);
  const error = pending || dismissed ? null : state.error;
  const placeholder = useTypewriterPlaceholder(reduced !== true && handle.length === 0);

  useMood("idle");

  useEffect(() => {
    if (!pending) {
      inputRef.current?.focus();
    }
  }, [pending]);

  useGSAP(
    () => {
      if (pending || reduced !== false) {
        return;
      }

      const timeline = gsap.timeline({ defaults: { ease: "expo.out" } });

      if (logoRef.current) {
        timeline.fromTo(
          logoRef.current,
          { opacity: 0, y: -18 },
          { opacity: 1, y: 0, duration: 0.9 },
        );
      }

      if (pillRef.current) {
        timeline.fromTo(
          pillRef.current,
          { opacity: 0, y: 22, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8 },
          0.35,
        );
      }
    },
    { dependencies: [pending, reduced] },
  );

  useGSAP(
    () => {
      const at = atRef.current;
      if (!at || reduced !== false || !focused) {
        return;
      }

      gsap.fromTo(
        at,
        { scale: 1 },
        { scale: 1.15, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" },
      );
    },
    { dependencies: [focused, reduced] },
  );

  const submitAction = (formData: FormData) => {
    setDismissed(false);
    return formAction(formData);
  };

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-x-clip">
      <ParticleField />

      {pending ? (
        <div className="relative z-10 w-full">
          <LoadingCinematic handle={parseHandleInput(handle)} />
        </div>
      ) : (
        <form
          ref={formRef}
          action={submitAction}
          className="relative z-10 flex w-full max-w-4xl flex-col items-center px-4 py-12 text-center sm:px-6 sm:py-16"
        >
          <div ref={logoRef} className="float mb-10">
            <Image
              src="/cursor-lockup.svg"
              alt="Cursor"
              width={220}
              height={53}
              priority
              className="h-12 w-auto drop-shadow-[0_0_28px_rgba(245,78,0,0.45)] sm:h-16"
            />
          </div>

          <p className="text-accent text-micro mb-5 tracking-[0.32em] uppercase">
            <SplitText text="The year in code" by="words" delay={0.3} />
          </p>

          <h1 className="text-hero max-w-[12ch] overflow-visible font-bold sm:max-w-none">
            <SplitText
              text="Whose year is it?"
              by="words"
              delay={0.45}
              unitClassName="gradient-ink"
              caret
            />
          </h1>

          <div
            ref={pillRef}
            className={cx(
              "glass mt-8 flex w-full max-w-3xl flex-col items-stretch gap-3 rounded-3xl p-3 transition-[box-shadow,border-color] duration-500 sm:mt-12 sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:py-2 sm:pr-2 sm:pl-7",
              focused && !error && "border-accent/60 shadow-glow",
              error &&
                "border-danger bg-danger/10 shadow-[0_0_70px_-8px_var(--color-danger),inset_0_0_40px_-20px_var(--color-danger)]",
              error && reduced !== true && "animate-[shake_0.5s_ease-in-out]",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3 sm:px-0">
              <span
                ref={atRef}
                aria-hidden="true"
                className={cx(
                  "text-heading sm:text-display inline-block font-semibold transition-colors duration-300",
                  focused ? "text-accent text-glow" : "text-ink-faint",
                )}
              >
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
                placeholder={placeholder}
                value={handle}
                aria-invalid={error !== null}
                aria-describedby={error ? errorId : undefined}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onChange={(event) => {
                  setHandle(event.target.value);
                  if (error) {
                    setDismissed(true);
                  }
                }}
                className="text-title sm:text-display text-ink placeholder:text-ink-faint/60 min-w-0 flex-1 bg-transparent py-3 font-semibold outline-none sm:py-4"
              />
            </div>
            <MagneticButton type="submit" size="lg" className="w-full shrink-0 sm:w-auto">
              Play
              <span aria-hidden="true" className="text-xl leading-none">
                →
              </span>
            </MagneticButton>
          </div>

          <div className="relative mt-6 h-[1.8em] w-full">
            <GsapSwap id={error ?? "hint"} className="absolute inset-x-0">
              <p
                id={errorId}
                role={error ? "alert" : undefined}
                className={cx(
                  "text-base",
                  error ? "text-danger-text" : "text-ink-faint",
                )}
              >
                {error ? errorCopy(error) : "Public profiles only. Press Enter to play."}
              </p>
            </GsapSwap>
          </div>
        </form>
      )}
    </main>
  );
}
