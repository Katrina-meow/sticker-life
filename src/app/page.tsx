import { redirect } from "next/navigation";
import { DEFAULT_CATEGORY_ORDER } from "@/lib/categoryConfig";

export default function Home() {
  redirect(`/c/${DEFAULT_CATEGORY_ORDER[0]}`);
}
