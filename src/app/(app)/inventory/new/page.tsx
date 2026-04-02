import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/data";

export default async function NewInventoryPage({
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const viewer = await requireViewer();

  if (viewer.profile.isAnonymous) {
    redirect("/glazes?error=Guest%20mode%20cannot%20save%20inventory");
  }

  redirect("/glazes");
}
