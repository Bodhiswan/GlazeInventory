import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

export function SetupCallout({ compact = false }: { compact?: boolean }) {
  return (
    <Panel className={cn("border-accent/10 bg-panel", compact && "p-5")}>
      <p className="text-sm uppercase tracking-[0.2em] text-accent">Demo mode</p>
      <h3 className="display-font mt-2 text-2xl tracking-tight">
        Supabase is not configured yet, so the app is running against a preview dataset.
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Add your Supabase URL and anon key in <code>.env.local</code> to enable verified email
        accounts, private inventory records, uploads, and moderation persistence.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
          Open demo workspace
        </Link>
      </div>
    </Panel>
  );
}
