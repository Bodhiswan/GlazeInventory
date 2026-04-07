import { toggleGlazeTagVoteAction } from "@/app/actions/glazes";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Glaze } from "@/lib/types";

const categoryOrder = ["Surface", "Opacity", "Movement", "Application", "Visual"];

function groupTags(glaze: Glaze) {
  const tags = glaze.communityTags ?? [];
  return categoryOrder
    .map((category) => ({
      category,
      tags: tags.filter((tag) => tag.category === category),
    }))
    .filter((group) => group.tags.length);
}

export function GlazeTraitVoter({
  glaze,
  returnTo,
}: {
  glaze: Glaze;
  returnTo: string;
}) {
  if (glaze.sourceType !== "commercial" || !glaze.communityTags?.length) {
    return null;
  }

  const groups = groupTags(glaze);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold text-foreground">Community traits</p>
        <Badge tone="neutral">vote what matches</Badge>
      </div>
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.category} className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">{group.category}</p>
            <div className="flex flex-wrap gap-2">
              {group.tags.map((tag) => (
                <form key={tag.slug} action={toggleGlazeTagVoteAction}>
                  <input type="hidden" name="glazeId" value={glaze.id} />
                  <input type="hidden" name="tagSlug" value={tag.slug} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button
                    type="submit"
                    title={tag.description ?? tag.label}
                    className={cn(
                      "inline-flex items-center gap-2 border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition",
                      tag.viewerHasVoted
                        ? "border-foreground bg-[#2d1c16] text-white"
                        : "border-border bg-panel text-foreground hover:border-foreground/30 hover:bg-white",
                    )}
                  >
                    <span>{tag.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px]",
                        tag.viewerHasVoted ? "bg-white/15 text-white" : "bg-black/5 text-muted",
                      )}
                    >
                      {tag.voteCount}
                    </span>
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
