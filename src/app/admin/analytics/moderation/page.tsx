import { redirect } from "next/navigation";

/** The submission queue moved into the unified moderation screen. */
export default function LegacyModerationPage() {
  redirect("/admin/moderation");
}
