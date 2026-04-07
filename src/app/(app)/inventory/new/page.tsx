import { redirect } from "next/navigation";

import { requireViewer } from "@/lib/data";

export default async function NewInventoryPage({
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireViewer();
  redirect("/glazes/new");
}
