import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { HANDLE_PATTERN, parseHandleInput } from "@/lib/handle";

/** A native GET of `/?handle=name` (or a shared link) should open the profile,
 *  not sit on the home gate until the streamed RSC redirect fires. */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const handle = parseHandleInput(request.nextUrl.searchParams.get("handle"));
  if (!handle || !HANDLE_PATTERN.test(handle)) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.pathname = `/@${handle}`;
  destination.search = "";
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: "/",
};
