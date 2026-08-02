import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[720px] items-center px-6 py-12">
      <Panel className="w-full text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted">Not found</p>
        <h1 className="display-font mt-2 text-5xl tracking-tight">This page isn&apos;t here.</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          The link may be out of date, or the page may have moved.
        </p>
        <Link href="/glazes" className={buttonVariants({ className: "mt-6" })}>
          Browse the library
        </Link>
      </Panel>
    </main>
  );
}
