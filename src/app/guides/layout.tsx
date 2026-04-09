import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { PublicWorkspaceShell } from "@/components/public-workspace-shell";
import { getViewer } from "@/lib/data/users";

export const metadata: Metadata = {
  title: {
    template: "%s | Glaze Library Guides",
    default: "Guides | Glaze Library",
  },
};

export default async function GuidesLayout({
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
