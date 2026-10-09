import "@/components/new-layout/nl.css";

import { NLProvider } from "@/components/new-layout/provider";
import { getNLViewerState } from "@/lib/new-layout/viewer-state";

/** The Cone 6 layout. Reached through proxy.ts rewrites, so its URLs match the classic site's. */
export default async function NewLayout({ children }: { children: React.ReactNode }) {
  const state = await getNLViewerState();
  return (
    <div className="nl">
      <NLProvider initial={state}>{children}</NLProvider>
    </div>
  );
}
