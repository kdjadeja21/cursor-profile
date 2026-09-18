import { Suspense } from "react";
import { redirect } from "next/navigation";
import { HandleGate } from "@/components/landing/handle-gate";
import { getCursorProfile } from "@/lib/cursor-profile";
import { HANDLE_PATTERN, parseHandleInput } from "@/lib/handle";
import type { GateError } from "@/app/play-profile";

function firstQueryValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return null;
}

async function HomeFromQuery({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  const params = await searchParams;
  const handle = parseHandleInput(firstQueryValue(params.handle));

  if (!handle) {
    return <HandleGate />;
  }

  if (!HANDLE_PATTERN.test(handle)) {
    return <HandleGate initialHandle={handle} initialError="invalid" />;
  }

  const result = await getCursorProfile(handle);
  if (result.ok) {
    redirect(`/@${handle}`);
  }

  const initialError: GateError =
    result.reason === "not-found" ? "not-found" : "unavailable";

  return <HandleGate initialHandle={handle} initialError={initialError} />;
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<HandleGate />}>
      <HomeFromQuery searchParams={searchParams} />
    </Suspense>
  );
}
