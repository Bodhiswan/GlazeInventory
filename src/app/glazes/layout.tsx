import { AppShell } from "@/components/app-shell";
import { PublicWorkspaceShell } from "@/components/public-workspace-shell";
import { getViewer } from "@/lib/data/users";

export default async function GlazesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getViewer();

  if (viewer) {
    return <AppShell viewer={viewer}>{children}</AppShell>;
  }

  return <PublicWorkspaceShell>{children}</PublicWorkspaceShell>;
}
