"use client";

import { useEffect, useState } from "react";

type Profile = {
  name: string;
  username: string;
  avatarUrl: string | null;
  visibility: string | null;
  badges: string[];
  links: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.name === "string" &&
    typeof data.username === "string" &&
    (data.avatarUrl === null || typeof data.avatarUrl === "string") &&
    (data.visibility === null || typeof data.visibility === "string") &&
    Array.isArray(data.badges) &&
    data.badges.every((badge) => typeof badge === "string") &&
    Array.isArray(data.links) &&
    data.links.every((link) => typeof link === "string") &&
    (data.createdAt === null || typeof data.createdAt === "string") &&
    (data.updatedAt === null || typeof data.updatedAt === "string")
  );
}

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatBadge(value: string): string {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function linkLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname;
  } catch {
    return url;
  }
}

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle: "kdjadeja" }),
          signal: controller.signal,
        });

        const data: unknown = await response.json();

        if (!response.ok) {
          const message =
            data &&
            typeof data === "object" &&
            "error" in data &&
            typeof data.error === "string"
              ? data.error
              : "Failed to load the profile.";
          throw new Error(message);
        }

        if (!isProfile(data)) {
          throw new Error("Failed to load the profile.");
        }

        setProfile(data);
      } catch (cause) {
        if (controller.signal.aborted) {
          return;
        }

        setProfile(null);
        setError(
          cause instanceof Error ? cause.message : "Failed to load the profile.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => controller.abort();
  }, []);

  const createdAt = profile ? formatDate(profile.createdAt) : null;
  const updatedAt = profile ? formatDate(profile.updatedAt) : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-md rounded-2xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        {isLoading ? (
          <p className="text-zinc-500 dark:text-zinc-400">Loading profile…</p>
        ) : error ? (
          <p className="text-red-600 dark:text-red-400">{error}</p>
        ) : profile ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.name} avatar`}
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] rounded-full object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-zinc-200 text-xl font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {profile.name.charAt(0)}
                </div>
              )}
              <div className="flex min-w-0 flex-col gap-1">
                <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
                  {profile.name}
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  @{profile.username}
                </p>
                {profile.visibility ? (
                  <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                    {profile.visibility}
                  </p>
                ) : null}
              </div>
            </div>

            {profile.badges.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {profile.badges.map((badge) => (
                  <li
                    key={badge}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {formatBadge(badge)}
                  </li>
                ))}
              </ul>
            ) : null}

            {profile.links.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {profile.links.map((link) => (
                  <li key={link}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
                    >
                      {linkLabel(link)}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}

            {createdAt || updatedAt ? (
              <dl className="flex flex-col gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                {createdAt ? (
                  <div>
                    <dt className="inline font-medium text-zinc-600 dark:text-zinc-300">
                      Joined:{" "}
                    </dt>
                    <dd className="inline">{createdAt}</dd>
                  </div>
                ) : null}
                {updatedAt ? (
                  <div>
                    <dt className="inline font-medium text-zinc-600 dark:text-zinc-300">
                      Updated:{" "}
                    </dt>
                    <dd className="inline">{updatedAt}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
