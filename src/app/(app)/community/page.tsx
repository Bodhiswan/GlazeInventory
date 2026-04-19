import { Suspense } from "react";
import { Search } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { requireViewer } from "@/lib/data/users";
import { formatSearchQuery } from "@/lib/utils";
import { CommunityPostsServer } from "./_components/community-posts-server";
import { CommunityPostsSkeleton } from "./_components/community-posts-skeleton";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireViewer();
  const params = await searchParams;
  const query = formatSearchQuery(params.q);

  return (
    <div className="space-y-8">
      <PageHeader
        tone="rose"
        eyebrow="Community"
        title="Shared kiln-tested combinations"
        description="Browse what other members have published, then jump into the pair detail page when a result overlaps with your shelf."
      />

      <Panel>
        <form className="flex items-center gap-3">
          <Search className="h-4 w-4 text-muted" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search by glaze name, trait tag, caption, firing note, or application note"
            className="border-0 bg-transparent px-0"
          />
        </form>
      </Panel>

      <Suspense fallback={<CommunityPostsSkeleton />}>
        <CommunityPostsServer query={query} />
      </Suspense>
    </div>
  );
}
