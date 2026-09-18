import {
  DEFAULT_HANDLE,
  ProfileNotFoundError,
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

  try {
    return Response.json(await getCursorProfile(handle));
  } catch (cause) {
    if (cause instanceof ProfileNotFoundError) {
      return Response.json({ error: "Profile not found." }, { status: 404 });
    }

    return Response.json(
      { error: "Failed to load the profile." },
      { status: 502 },
    );
  }
}
