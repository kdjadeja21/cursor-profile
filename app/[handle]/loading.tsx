import { RouteLoading } from "@/components/fx/route-loading";

export default function Loading() {
  return (
    <main aria-busy="true" className="flex flex-1 flex-col">
      <RouteLoading />
    </main>
  );
}
