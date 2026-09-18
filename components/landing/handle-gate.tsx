"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  playProfile,
  type GateError,
  type GateState,
} from "@/app/play-profile";
import { LoadingCinematic } from "@/components/fx/loading-cinematic";
import { MagneticButton } from "@/components/fx/magnetic";
import { ParticleField } from "@/components/fx/particle-field";
import { SplitText } from "@/components/fx/split-text";
import { parseHandleInput } from "@/lib/handle";
import { useMood } from "@/lib/use-mood";
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
  const [state, formAction, pending] = useActionState<GateState, FormData>(
    playProfile,
    { error: initialError },
  );
  const [dismissed, setDismissed] = useState(false);
  const [handle, setHandle] = useState(initialHandle);
  const [focused, setFocused] = useState(false);
  const error = pending || dismissed ? null : state.error;
  const placeholder = useTypewriterPlaceholder(!reduced && handle.length === 0);

  useMood("idle");

  useEffect(() => {
    if (!pending) {
      inputRef.current?.focus();
    }
  }, [pending]);

  const submitAction = (formData: FormData) => {
    setDismissed(false);
    return formAction(formData);
  };

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
      <ParticleField />

      <AnimatePresence mode="wait" initial={false}>
        {pending ? (
          <motion.div
            key="loading"
            className="relative z-10 w-full"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            <LoadingCinematic
              handle={parseHandleInput(handle)}
              layoutId="gate-orb"
            />
          </motion.div>
        ) : (
          <motion.form
            key="form"
            action={submitAction}
            className="relative z-10 flex w-full max-w-4xl flex-col items-center px-6 py-16 text-center"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.45 }}
          >
            <motion.div
              initial={reduced ? false : { opacity: 0, y: -18, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="float mb-10"
            >
              <Image
                src="/cursor-lockup.svg"
                alt="Cursor"
                width={220}
                height={53}
                priority
                className="h-12 w-auto drop-shadow-[0_0_28px_rgba(245,78,0,0.45)] sm:h-16"
              />
            </motion.div>

            <p className="text-accent text-micro mb-5 tracking-[0.32em] uppercase">
              <SplitText text="The year in code" by="words" delay={0.3} />
            </p>

            <h1 className="text-hero lg:text-giant drop-glow font-bold">
              <SplitText
                text="Whose year is it?"
                by="chars"
                delay={0.45}
                unitClassName="gradient-ink"
                caret
              />
            </h1>

            <motion.div
              layoutId="gate-orb"
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
              className={cx(
                "glass mt-14 flex w-full max-w-3xl items-center gap-2 rounded-full py-2 pr-2 pl-7 transition-[box-shadow,border-color] duration-500",
                focused && !error && "border-accent/60 shadow-glow",
                error &&
                  "border-danger bg-danger/10 shadow-[0_0_70px_-8px_var(--color-danger),inset_0_0_40px_-20px_var(--color-danger)]",
                error && !reduced && "animate-[shake_0.5s_ease-in-out]",
              )}
            >
              <motion.span
                aria-hidden="true"
                className={cx(
                  "text-display font-semibold transition-colors duration-300",
                  focused ? "text-accent text-glow" : "text-ink-faint",
                )}
                animate={focused && !reduced ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                @
              </motion.span>
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
                className="text-display text-ink placeholder:text-ink-faint/60 min-w-0 flex-1 bg-transparent py-4 font-semibold outline-none"
              />
              <MagneticButton type="submit" size="lg" className="shrink-0">
                Play
                <span aria-hidden="true" className="text-xl leading-none">
                  →
                </span>
              </MagneticButton>
            </motion.div>

            <div className="relative mt-6 h-[1.8em] w-full">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={error ?? "hint"}
                  id={errorId}
                  role={error ? "alert" : undefined}
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className={cx(
                    "text-base absolute inset-x-0",
                    error ? "text-danger-text" : "text-ink-faint",
                  )}
                >
                  {error ? errorCopy(error) : "Public profiles only. Press Enter to play."}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </main>
  );
}
