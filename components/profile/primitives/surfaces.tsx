import type { ReactNode } from "react";
import { Reveal } from "@/components/profile/primitives/reveal";
import { cx } from "@/lib/cx";

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "border-edge bg-surface-glass relative overflow-hidden rounded-2xl border backdrop-blur-[2px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  description,
  aside,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cx("scroll-mt-16 py-12 sm:py-16", className)}
    >
      <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-ink-faint text-micro mb-3 tracking-[0.22em] uppercase">
            {eyebrow}
          </p>
          <h2 id={`${id}-title`} className="text-heading text-ink">
            {title}
          </h2>
          {description ? (
            <p className="text-ink-muted text-small mt-2 max-w-xl">
              {description}
            </p>
          ) : null}
        </div>
        {aside}
      </Reveal>
      <Reveal delay={0.1}>{children}</Reveal>
    </section>
  );
}
