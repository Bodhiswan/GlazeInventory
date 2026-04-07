"use client";

import { format } from "date-fns";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  addCombinationCommentInlineAction,
  addGlazeCommentInlineAction,
} from "@/app/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface Comment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

// ─── Glaze comments ──────────────────────────────────────────────────────────

export function GlazeCommentsPanel({ glazeId }: { glazeId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setComments([]);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from("glaze_comments")
      .select("id, body, created_at, author:profiles(display_name)")
      .eq("glaze_id", glazeId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setComments(
          (data ?? []).map((row) => {
            const author = Array.isArray(row.author) ? row.author[0] : row.author;
            return {
              id: String(row.id),
              authorName: String((author as { display_name?: string } | null)?.display_name ?? "Member"),
              body: String(row.body),
              createdAt: String(row.created_at),
            };
          }),
        );
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [glazeId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitError(null);

    startTransition(async () => {
      const result = await addGlazeCommentInlineAction(glazeId, body);
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      const newComment: Comment = {
        id: crypto.randomUUID(),
        authorName: result.authorName ?? "You",
        body: body.trim(),
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [newComment, ...prev]);
      setBody("");
      textareaRef.current?.focus();
    });
  }

  return <CommentsUI comments={comments} loading={loading} body={body} setBody={setBody} submitError={submitError} isPending={isPending} textareaRef={textareaRef} onSubmit={handleSubmit} />;
}

// ─── Combination comments ─────────────────────────────────────────────────────

export function CombinationCommentsPanel({ exampleId }: { exampleId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setComments([]);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from("combination_comments")
      .select("id, body, created_at, author:profiles(display_name)")
      .eq("example_id", exampleId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setComments(
          (data ?? []).map((row) => {
            const author = Array.isArray(row.author) ? row.author[0] : row.author;
            return {
              id: String(row.id),
              authorName: String((author as { display_name?: string } | null)?.display_name ?? "Member"),
              body: String(row.body),
              createdAt: String(row.created_at),
            };
          }),
        );
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [exampleId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitError(null);

    startTransition(async () => {
      const result = await addCombinationCommentInlineAction(exampleId, body);
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      const newComment: Comment = {
        id: crypto.randomUUID(),
        authorName: result.authorName ?? "You",
        body: body.trim(),
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [newComment, ...prev]);
      setBody("");
      textareaRef.current?.focus();
    });
  }

  return <CommentsUI comments={comments} loading={loading} body={body} setBody={setBody} submitError={submitError} isPending={isPending} textareaRef={textareaRef} onSubmit={handleSubmit} />;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function CommentsUI({
  comments,
  loading,
  body,
  setBody,
  submitError,
  isPending,
  textareaRef,
  onSubmit,
}: {
  comments: Comment[];
  loading: boolean;
  body: string;
  setBody: (v: string) => void;
  submitError: string | null;
  isPending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="border-t border-border pt-4 mt-4 space-y-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Comments</p>

      <form onSubmit={onSubmit} className="space-y-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note about application, results, or firing..."
          rows={2}
          className="w-full resize-none border border-border bg-panel px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/10"
          disabled={isPending}
        />
        {submitError ? (
          <p className="text-xs text-[#7f4026]">{submitError}</p>
        ) : null}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="border border-border bg-foreground px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-background transition hover:opacity-80 disabled:opacity-40"
          >
            {isPending ? "Posting…" : "Post comment"}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-xs text-muted">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="border border-border bg-panel p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">{comment.authorName}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  {format(new Date(comment.createdAt), "d MMM yyyy")}
                </p>
              </div>
              <p className="text-sm leading-5 text-muted">{comment.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
