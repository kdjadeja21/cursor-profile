export const DEFAULT_HANDLE = "kdjadeja";
export const HANDLE_PATTERN = /^[a-zA-Z0-9._-]{1,39}$/;

/** Empty input stays empty. `normalizeHandle` still falls back to the sample profile
 *  so the API route can keep serving a default when no handle is sent. */
export function parseHandleInput(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const handle = value.trim().replace(/^@+/, "");
  return handle.length > 0 ? handle : null;
}

export function normalizeHandle(value: unknown): string {
  return parseHandleInput(value) ?? DEFAULT_HANDLE;
}
