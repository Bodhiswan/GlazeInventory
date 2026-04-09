import type { Metadata } from "next";

import { PublicWorkspaceShell } from "@/components/public-workspace-shell";

export const metadata: Metadata = {
  title: {
    template: "%s | Glaze Library Guides",
    default: "Guides | Glaze Library",
  },
};

export default function GuidesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicWorkspaceShell>{children}</PublicWorkspaceShell>;
}
