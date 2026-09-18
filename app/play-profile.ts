"use server";

import { redirect } from "next/navigation";
import { getCursorProfile } from "@/lib/cursor-profile";
import { HANDLE_PATTERN, parseHandleInput } from "@/lib/handle";

export type GateError = "empty" | "invalid" | "not-found" | "unavailable";

export type GateState = {
  error: GateError | null;
};

export async function playProfile(
  _previous: GateState,
  formData: FormData,
): Promise<GateState> {
  const handle = parseHandleInput(formData.get("handle"));
  if (!handle) {
    return { error: "empty" };
  }

  if (!HANDLE_PATTERN.test(handle)) {
    return { error: "invalid" };
  }

  const result = await getCursorProfile(handle);
  if (!result.ok) {
    return {
      error: result.reason === "not-found" ? "not-found" : "unavailable",
    };
  }

  redirect(`/@${handle}`);
}
