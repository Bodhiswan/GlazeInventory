import { AppShell } from "@/components/app-shell";
import { requireViewer } from "@/lib/data";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await requireViewer();

  return <AppShell viewer={viewer}>{children}</AppShell>;
}
