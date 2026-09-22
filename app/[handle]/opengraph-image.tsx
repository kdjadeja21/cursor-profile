import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getCursorProfile, normalizeHandle } from "@/lib/cursor-profile";
import {
  buildStory,
  formatCompactNumber,
  formatDuration,
} from "@/lib/derive";

export const alt = "Cursor profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SURFACE = "#141414";
const ACCENT = "#f54e00";
const INK = "#f5f5f4";
const INK_MUTED = "#a3a3a0";
const INK_FAINT = "#6e6e6b";

/** Mirrors the on-page quartile bands so the card and the page tell the same story. */
const CELL_COLOURS = [
  "rgba(255,255,255,0.05)",
  "rgba(245,78,0,0.25)",
  "rgba(245,78,0,0.45)",
  "rgba(245,78,0,0.7)",
  ACCENT,
];

async function loadOgFonts() {
  const dir = join(process.cwd(), "app/fonts");
  const [regular, bold] = await Promise.all([
    readFile(join(dir, "CursorGothic-Regular.ttf")),
    readFile(join(dir, "CursorGothic-Bold.ttf")),
  ]);

  return [
    {
      name: "CursorGothic",
      data: regular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "CursorGothic",
      data: bold,
      weight: 700 as const,
      style: "normal" as const,
    },
  ];
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ color: INK_FAINT, fontSize: 20, letterSpacing: 3 }}>
        {label.toUpperCase()}
      </span>
      <span
        style={{
          color: emphasis ? ACCENT : INK,
          fontSize: 56,
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  const result = await getCursorProfile(
    normalizeHandle(decodeURIComponent(handle)),
  );
  const fonts = await loadOgFonts();

  if (!result.ok) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: SURFACE,
            color: INK_MUTED,
            fontFamily: "CursorGothic",
            fontSize: 48,
          }}
        >
          No public profile
        </div>
      ),
      { ...size, fonts },
    );
  }

  const { profile, activity } = result;
  const story = buildStory(activity, profile.createdAt);
  // Only the most recent stretch fits legibly alongside the name at card size.
  const recent = story.calendar.weeks.slice(-17);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
            background: SURFACE,
          fontFamily: "CursorGothic",
          padding: 64,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "radial-gradient(70% 90% at 0% 0%, rgba(245,78,0,0.30), rgba(20,20,20,0) 65%)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 48,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ color: ACCENT, fontSize: 22, letterSpacing: 4 }}>
              CURSOR AMBASSADOR
            </span>
            <span
              style={{
                color: INK,
                fontSize: 64,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              {profile.displayName}
            </span>
            <span style={{ color: INK_MUTED, fontSize: 30 }}>
              @{profile.handle}
            </span>
          </div>

          <div style={{ display: "flex", gap: 5 }}>
            {recent.map((week, weekIndex) => (
              <div
                key={weekIndex}
                style={{ display: "flex", flexDirection: "column", gap: 5 }}
              >
                {week.map((cell) => (
                  <div
                    key={cell.date}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      background: cell.inRange
                        ? CELL_COLOURS[cell.level]
                        : "rgba(255,255,255,0.03)",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 80 }}>
          <Stat
            label="Tokens"
            value={formatCompactNumber(story.calendar.totalTokens)}
            emphasis
          />
          <Stat label="Agents" value={`${story.agents.total}`} />
          <Stat label="Longest streak" value={`${story.streak.longest}d`} />
          <Stat
            label="Longest agent"
            value={formatDuration(activity.longestAgentSeconds)}
          />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
