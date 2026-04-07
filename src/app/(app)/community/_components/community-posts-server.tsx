import { PostCard } from "@/components/post-card";
import { Panel } from "@/components/ui/panel";
import { getCommunityPosts } from "@/lib/data/community";

export async function CommunityPostsServer({ query }: { query: string | undefined }) {
  const posts = await getCommunityPosts(query ?? "");

  if (!posts.length) {
    return (
      <Panel>
        <h2 className="display-font text-3xl tracking-tight">No matches found.</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Try a glaze name, cone range, trait word like matte or runny, or one of the descriptive words from a caption.
        </p>
      </Panel>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
