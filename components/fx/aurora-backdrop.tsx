/**
 * The stage. Slow drifting blobs of the brand hue, a film-grain layer and a vignette,
 * all fixed behind every route so navigation never flashes to a flat background.
 * Pure CSS: `html[data-mood]` scales intensity and speed through custom properties.
 */

const BLOBS = [
  {
    className: "aurora-blob left-[-10%] top-[-20%] h-[70vh] w-[70vw]",
    colour: "var(--color-accent)",
    alpha: 0.32,
    delay: "0s",
  },
  {
    className: "aurora-blob right-[-15%] top-[10%] h-[60vh] w-[55vw]",
    colour: "var(--color-accent-deep)",
    alpha: 0.4,
    delay: "-9s",
  },
  {
    className: "aurora-blob bottom-[-25%] left-[20%] h-[65vh] w-[60vw]",
    colour: "var(--color-ember)",
    alpha: 0.16,
    delay: "-17s",
  },
  {
    className: "aurora-blob bottom-[5%] right-[5%] h-[40vh] w-[35vw]",
    colour: "var(--color-accent-soft)",
    alpha: 0.18,
    delay: "-5s",
  },
];

export function AuroraBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: "var(--aurora-intensity)" }}
      >
        {BLOBS.map((blob) => (
          <div
            key={blob.className}
            className={`absolute rounded-full blur-[90px] ${blob.className}`}
            style={{
              background: `radial-gradient(closest-side, color-mix(in srgb, ${blob.colour} ${Math.round(blob.alpha * 100)}%, transparent), transparent)`,
              animationDelay: blob.delay,
            }}
          />
        ))}
      </div>

      {/* Grain keeps the huge soft gradients from banding on projectors. */}
      <svg className="absolute inset-[-10%] h-[120%] w-[120%] opacity-[0.07] mix-blend-overlay grain">
        <filter id="aurora-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#aurora-grain)" />
      </svg>

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 40%, transparent 40%, rgb(0 0 0 / 0.55) 100%)",
        }}
      />
    </div>
  );
}
