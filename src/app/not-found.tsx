import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] items-center px-6 py-12">
      <Panel className="w-full text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">Not found</p>
        <h1 className="display-font mt-2 text-5xl tracking-tight">This glaze page is missing.</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          The pair or inventory entry you asked for does not exist anymore.
        </p>
        <Link href="/dashboard" className={buttonVariants({ className: "mt-6" })}>
          Back to dashboard
        </Link>
      </Panel>
    </main>
  );
}
