/**
 * Embeds a link card for a YouTube (or other provider) tutorial video
 * inside a guide page. The card is NOT an iframe — it opens the video on
 * YouTube in a new tab. That keeps the guide page fast, respects user
 * choice about whether to load a YouTube player, and most importantly
 * keeps the source URL visible so contributors can audit each video
 * before it ships to members.
 *
 * Typical usage inside a guide content file:
 *
 *   <GuideVideo
 *     title="How to measure specific gravity"
 *     channel="Sue McLeod Ceramics"
 *     url="https://www.youtube.com/watch?v=XXXXXXXXXXX"
 *     note="Walks through the graduated-cylinder method step by step."
 *   />
 *
 * Pass a `pending` flag while a slot is still waiting on a curated URL
 * so the card renders as a clearly-marked TODO rather than a dead link.
 */
export function GuideVideo({
  title,
  channel,
  url,
  note,
  pending = false,
}: {
  title: string;
  channel?: string;
  url?: string;
  note?: string;
  pending?: boolean;
}) {
  const hasUrl = Boolean(url && !pending);
  const videoId = hasUrl ? extractYouTubeId(url!) : null;
  const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;

  const body = (
    <div className="flex items-stretch gap-0 overflow-hidden border border-border bg-panel-strong">
      <div className="relative hidden aspect-video w-40 shrink-0 bg-black/5 sm:block">
        {thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.16em] text-muted">
            {pending ? "Video pending" : "Video"}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-3 sm:p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.16em] text-accent-2">
              Video tutorial
            </span>
            {pending ? (
              <span className="border border-dashed border-border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-muted">
                URL pending
              </span>
            ) : null}
          </div>
          <p className="text-sm font-medium leading-5 text-foreground">{title}</p>
          {channel ? (
            <p className="text-[12px] text-muted">{channel}</p>
          ) : null}
        </div>
        {note ? (
          <p className="text-[12px] leading-5 text-muted">{note}</p>
        ) : null}
        {hasUrl ? (
          <a
            href={url!}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-[11px] uppercase tracking-[0.14em] text-accent-2 underline underline-offset-4 hover:text-foreground"
          >
            Watch on YouTube →
          </a>
        ) : (
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
            TODO: paste a curated YouTube URL into this slot.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <figure className="not-prose my-6">
      {body}
    </figure>
  );
}

/**
 * Pulls the `v` ID out of any canonical YouTube URL shape we're likely to
 * see in content files. Returns null on unrecognised input so the card
 * falls back to a plain link without a thumbnail.
 */
function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.replace(/^\//, "") || null;
    }
    if (parsed.hostname.endsWith("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      // e.g. /shorts/xyz, /embed/xyz, /live/xyz
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments.length >= 2 && ["shorts", "embed", "live"].includes(segments[0])) {
        return segments[1];
      }
    }
  } catch {
    // Fall through
  }
  return null;
}
