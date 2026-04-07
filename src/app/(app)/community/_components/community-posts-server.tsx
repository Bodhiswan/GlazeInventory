import { PostCard } from "@/components/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCommunityPosts } from "@/lib/data/community";

export async function CommunityPostsServer({ query }: { query: string | undefined }) {
  const posts = await getCommunityPosts(query ?? "");

  if (!posts.length) {
    return (
      <EmptyState
        title="No matches found."
        description="Try a glaze name, cone range, trait word like matte or runny, or one of the descriptive words from a caption."
      />
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
