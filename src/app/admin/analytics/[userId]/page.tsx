import { redirect } from "next/navigation";

/** Member pages moved to /admin/users/[userId]. */
export default async function LegacyUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  redirect(`/admin/users/${userId}`);
}
