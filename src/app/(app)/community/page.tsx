import { Search } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { getCommunityPosts } from "@/lib/data";
import { requireViewer } from "@/lib/data/users";
import { formatSearchQuery } from "@/lib/utils";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireViewer();
  const params = await searchParams;
  const query = formatSearchQuery(params.q);
  const posts = await getCommunityPosts(query);

  return (
    <div className="space-y-8">
      <PageHeader
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

      {posts.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <Panel>
          <h2 className="display-font text-3xl tracking-tight">No matches found.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Try a glaze name, cone range, trait word like matte or runny, or one of the descriptive words from a caption.
          </p>
        </Panel>
      )}
    </div>
  );
}
