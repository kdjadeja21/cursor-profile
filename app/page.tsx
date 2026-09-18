import { redirect } from "next/navigation";
import { DEFAULT_HANDLE } from "@/lib/cursor-profile";

export default function Home() {
  redirect(`/@${DEFAULT_HANDLE}`);
}
