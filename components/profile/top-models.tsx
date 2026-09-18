"use client";

import type { TopModel } from "@/lib/cursor-profile";
import { CountUp } from "@/components/profile/primitives/count-up";
import { TiltCard } from "@/components/fx/tilt-card";
import { GsapFill } from "@/components/fx/gsap-fill";
import { SceneItem, useScene } from "@/components/profile/scene";
import { cx } from "@/lib/cx";

const VENDOR_TONE: Record<string, string> = {
  anthropic: "var(--color-accent-soft)",
  google: "var(--color-data-local)",
  cursor: "var(--color-accent)",
  openai: "var(--color-success)",
  xai: "var(--color-ink)",
};

function vendorTone(vendor: string | null): string {
  return (vendor && VENDOR_TONE[vendor.toLowerCase()]) || "var(--color-ember)";
}

function vendorLabel(vendor: string | null): string | null {
  if (!vendor) {
    return null;
  }

  return vendor.charAt(0).toUpperCase() + vendor.slice(1);
}

function ModelCard({
  model,
  rank,
  share,
  featured,
  delay,
}: {
  model: TopModel;
  rank: number;
  share: number;
  featured?: boolean;
  delay: number;
}) {
  const { ready } = useScene();
  const tone = vendorTone(model.vendor);

  return (
    <SceneItem delay={delay} from={featured ? "scale" : rank % 2 === 0 ? "left" : "right"}>
      <TiltCard
        glow={featured}
        intensity={featured ? 8 : 5}
        className={cx(
          "flex h-full flex-col justify-between overflow-hidden p-4 sm:p-6 lg:p-8",
          featured && "border-accent/40",
        )}
      >
        <div>
          <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
            <span className="text-ink-faint text-micro tracking-[0.3em] uppercase">
              #{rank}
            </span>
            {vendorLabel(model.vendor) ? (
              <span
                className="text-micro rounded-full border px-2.5 py-0.5 tracking-[0.16em] uppercase sm:px-3 sm:py-1"
                style={{
                  color: tone,
                  borderColor: `color-mix(in srgb, ${tone} 50%, transparent)`,
                  background: `color-mix(in srgb, ${tone} 12%, transparent)`,
                }}
              >
                {vendorLabel(model.vendor)}
              </span>
            ) : null}
          </div>
          <p
            className={cx(
              "font-bold tracking-normal text-balance",
              featured ? "text-title sm:text-heading lg:text-display" : "text-title sm:text-heading",
            )}
          >
            {model.name}
          </p>
        </div>

        <div className="mt-4 sm:mt-6">
          <p
            className={cx(
              "tabular font-extrabold leading-none",
              featured ? "text-display sm:text-hero" : "text-heading sm:text-display",
            )}
          >
            <CountUp
              amount={model.agentRequests}
              kind="integer"
              start={ready}
              delay={delay + 0.15}
              duration={1.2}
            />
            <span className="text-ink-faint text-small ml-2 font-medium tracking-[0.12em] uppercase">
              {model.agentRequests === 1 ? "run" : "runs"}
            </span>
          </p>
          <div className="bg-edge mt-3 h-1.5 overflow-hidden rounded-full sm:mt-5">
            <GsapFill
              play={ready}
              duration={1.2}
              delay={delay + 0.3}
              className="h-full rounded-full"
              style={{
                width: `${Math.max(share * 100, 4)}%`,
                background: tone,
                boxShadow: `0 0 12px ${tone}`,
              }}
            />
          </div>
        </div>
      </TiltCard>
    </SceneItem>
  );
}

export function TopModels({ models }: { models: TopModel[] }) {
  const peak = models.reduce((best, model) => Math.max(best, model.agentRequests), 0);
  const shown = models.slice(0, 4);
  const featured = shown[0];
  const rest = shown.slice(1);

  if (!featured) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-stretch lg:gap-5">
      <ModelCard
        model={featured}
        rank={1}
        share={peak > 0 ? featured.agentRequests / peak : 0}
        featured
        delay={0.2}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1">
        {rest.map((model, index) => (
          <ModelCard
            key={model.name}
            model={model}
            rank={index + 2}
            share={peak > 0 ? model.agentRequests / peak : 0}
            delay={0.35 + index * 0.1}
          />
        ))}
      </div>
    </div>
  );
}
