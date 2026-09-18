import {
  DEFAULT_HANDLE,
  getCursorProfile,
  normalizeHandle,
} from "@/lib/cursor-profile";

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

  const result = await getCursorProfile(handle);

  if (!result.ok) {
    return result.reason === "not-found"
      ? Response.json({ error: "Profile not found." }, { status: 404 })
      : Response.json({ error: "Failed to load the profile." }, { status: 502 });
  }

  return Response.json({
    profile: result.profile,
    activity: result.activity,
  });
}
