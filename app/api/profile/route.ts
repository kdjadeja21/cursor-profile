const UPSTREAM_URL =
  "https://cursor.com/api/dashboard/get-public-profile-by-handle";
const DEFAULT_HANDLE = "kdjadeja";

type UpstreamProfile = {
  handle?: unknown;
  displayName?: unknown;
  avatarUrl?: unknown;
  visibility?: unknown;
  badges?: unknown;
  links?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type UpstreamResponse = {
  profile?: UpstreamProfile;
};

export type ProfileResponse = {
  name: string;
  username: string;
  avatarUrl: string | null;
  visibility: string | null;
  badges: string[];
  links: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

function normalizeHandle(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_HANDLE;
  }

  const handle = value.trim().replace(/^@/, "");
  return handle.length > 0 ? handle : DEFAULT_HANDLE;
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => asTrimmedString(item))
      .filter((item): item is string => item !== null);
  }

  if (value && typeof value === "object") {
    return Object.values(value)
      .map((item) => asTrimmedString(item))
      .filter((item): item is string => item !== null);
  }

  return [];
}

function toProfileResponse(profile: UpstreamProfile): ProfileResponse | null {
  const name = asTrimmedString(profile.displayName);
  const username = asTrimmedString(profile.handle);

  if (!name || !username) {
    return null;
  }

  return {
    name,
    username,
    avatarUrl: asTrimmedString(profile.avatarUrl),
    visibility: asTrimmedString(profile.visibility),
    badges: asStringList(profile.badges),
    links: asStringList(profile.links),
    createdAt: asTrimmedString(profile.createdAt),
    updatedAt: asTrimmedString(profile.updatedAt),
  };
}

export async function POST(request: Request) {
  let handle = DEFAULT_HANDLE;

  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "handle" in body) {
      handle = normalizeHandle((body as { handle: unknown }).handle);
    }
  } catch {
    handle = DEFAULT_HANDLE;
  }

  let upstream: Response;
  try {
    upstream = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    });
  } catch {
    return Response.json(
      { error: "Unable to reach the profile service." },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const status = upstream.status === 404 ? 404 : 502;
    return Response.json(
      {
        error:
          status === 404
            ? "Profile not found."
            : "Failed to load the profile.",
      },
      { status },
    );
  }

  let data: UpstreamResponse;
  try {
    data = (await upstream.json()) as UpstreamResponse;
  } catch {
    return Response.json(
      { error: "Failed to load the profile." },
      { status: 502 },
    );
  }

  if (!data.profile) {
    return Response.json({ error: "Profile not found." }, { status: 404 });
  }

  const profile = toProfileResponse(data.profile);
  if (!profile) {
    return Response.json({ error: "Profile not found." }, { status: 404 });
  }

  return Response.json(profile);
}
