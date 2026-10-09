import { Shell } from "@/components/new-layout/shell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
