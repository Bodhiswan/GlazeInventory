import { redirect } from "next/navigation";

export default async function StudioIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/studio/${slug}/library`);
}
