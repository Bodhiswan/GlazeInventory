import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { requireViewer } from "@/lib/data/users";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await requireViewer();

  return <AppShell viewer={viewer}>{children}</AppShell>;
}
