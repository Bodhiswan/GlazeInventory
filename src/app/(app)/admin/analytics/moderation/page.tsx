import { format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  adminApproveSubmissionAction,
  adminEditCombinationAction,
  adminEditCustomGlazeAction,
  adminPermanentDeleteSubmissionAction,
  adminRejectSubmissionAction,
  adminReopenSubmissionAction,
} from "@/app/actions";
import { adminEditCommunityFiringImageAction } from "@/app/actions/community";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/ui/panel";
import { getModerationQueue } from "@/lib/data/admin";
import { requireViewer } from "@/lib/data/users";
import type {
  ModerationCombination,
  ModerationCustomGlaze,
  ModerationFiringImage,
} from "@/lib/types";

type ModState = "pending" | "approved" | "rejected";
type Target = "combination" | "glaze" | "firingImage";

function partition<T extends { moderationState: string }>(items: T[]) {
  return {
    pending: items.filter((i) => i.moderationState === "pending"),
    approved: items.filter((i) => i.moderationState === "approved"),
    rejected: items.filter((i) => i.moderationState === "rejected"),
  };
}

function StateActions({
  target,
  id,
  state,
}: {
  target: Target;
  id: string;
  state: ModState;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {state === "pending" ? (
        <>
          <form action={adminApproveSubmissionAction}>
            <input type="hidden" name="target" value={target} />
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="border border-green-400 bg-green-50 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-green-700"
            >
              Approve
            </button>
          </form>
          <form action={adminRejectSubmissionAction}>
            <input type="hidden" name="target" value={target} />
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="border border-red-400 bg-red-50 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-red-700"
            >
              Reject
            </button>
          </form>
        </>
      ) : null}
      {state === "approved" ? (
        <>
          <span className="inline-flex items-center gap-1 border border-green-400 bg-green-50 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-green-700">
            ✓ Approved
          </span>
          <form action={adminReopenSubmissionAction}>
            <input type="hidden" name="target" value={target} />
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="border border-border bg-panel px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted"
            >
              Move back to pending
            </button>
          </form>
        </>
      ) : null}
      {state === "rejected" ? (
        <>
        <form action={adminReopenSubmissionAction}>
          <input type="hidden" name="target" value={target} />
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="border border-border bg-panel px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted"
          >
            Move back to pending
          </button>
        </form>
        <form action={adminPermanentDeleteSubmissionAction}>
          <input type="hidden" name="target" value={target} />
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="border border-red-600 bg-red-100 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-red-800"
          >
            Permanently delete
          </button>
        </form>
        </>
      ) : null}
    </div>
  );
}

function CombinationRow({
  combo,
  state,
}: {
  combo: ModerationCombination;
  state: ModState;
}) {
  return (
    <Panel className="space-y-0">
      <details>
        <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="font-medium">{combo.title || "(untitled)"}</span>
            <span className="text-xs text-muted">
              · {combo.authorName} · {format(new Date(combo.createdAt), "yyyy-MM-dd HH:mm")}
            </span>
          </span>
          <StateActions target="combination" id={combo.id} state={state} />
        </summary>
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted">
            cone: {combo.cone} · atmosphere: {combo.atmosphere} · status: {combo.status}
          </p>
          <p className="font-mono text-[10px] text-muted">{combo.id}</p>
          {combo.imageUrl ? (
            <img
              src={combo.imageUrl}
              alt=""
              className="h-32 w-auto border border-border object-cover"
            />
          ) : null}
          <form action={adminEditCombinationAction} className="mt-3 grid gap-2 text-sm">
            <input type="hidden" name="exampleId" value={combo.id} />
            <label className="grid gap-1">
              Title
              <input
                name="title"
                defaultValue={combo.title}
                className="border border-border px-2 py-1"
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="grid gap-1">
                Cone
                <input
                  name="cone"
                  defaultValue={combo.cone}
                  className="border border-border px-2 py-1"
                />
              </label>
              <label className="grid gap-1">
                Atmosphere
                <input
                  name="atmosphere"
                  defaultValue={combo.atmosphere}
                  className="border border-border px-2 py-1"
                />
              </label>
              <label className="grid gap-1">
                Status
                <select
                  name="status"
                  defaultValue={combo.status}
                  className="border border-border px-2 py-1"
                >
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="hidden">hidden</option>
                </select>
              </label>
            </div>
            <label className="grid gap-1">
              Notes
              <textarea
                name="notes"
                defaultValue={combo.notes ?? ""}
                rows={3}
                className="border border-border px-2 py-1 font-mono text-xs"
              />
            </label>
            <button
              type="submit"
              className="justify-self-start border border-border bg-panel px-3 py-1 text-[10px] uppercase tracking-[0.14em]"
            >
              Save edits
            </button>
          </form>
        </div>
      </details>
    </Panel>
  );
}

function GlazeRow({
  glaze,
  state,
}: {
  glaze: ModerationCustomGlaze;
  state: ModState;
}) {
  return (
    <Panel className="space-y-0">
      <details>
        <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="font-medium">
              {glaze.name}
              {glaze.brand ? ` · ${glaze.brand}` : ""}
              {glaze.code ? ` · ${glaze.code}` : ""}
            </span>
            <span className="text-xs text-muted">
              · {glaze.creatorName} · {format(new Date(glaze.createdAt), "yyyy-MM-dd HH:mm")}
            </span>
          </span>
          <StateActions target="glaze" id={glaze.id} state={state} />
        </summary>
        <div className="mt-3 space-y-3">
          <p className="font-mono text-[10px] text-muted">{glaze.id}</p>
          {glaze.imageUrl ? (
            <img
              src={glaze.imageUrl}
              alt=""
              className="h-32 w-auto border border-border object-cover"
            />
          ) : null}
          {glaze.colorNotes ? (
            <p className="text-xs text-muted">Color: {glaze.colorNotes}</p>
          ) : null}
          {glaze.finishNotes ? (
            <p className="text-xs text-muted">Finish: {glaze.finishNotes}</p>
          ) : null}
          <form action={adminEditCustomGlazeAction} className="mt-3 grid gap-2 text-sm">
            <input type="hidden" name="glazeId" value={glaze.id} />
            <div className="grid grid-cols-3 gap-2">
              <label className="grid gap-1">
                Name
                <input
                  name="name"
                  defaultValue={glaze.name}
                  className="border border-border px-2 py-1"
                />
              </label>
              <label className="grid gap-1">
                Brand
                <input
                  name="brand"
                  defaultValue={glaze.brand ?? ""}
                  className="border border-border px-2 py-1"
                />
              </label>
              <label className="grid gap-1">
                Code
                <input
                  name="code"
                  defaultValue={glaze.code ?? ""}
                  className="border border-border px-2 py-1"
                />
              </label>
            </div>
            <label className="grid gap-1">
              Color notes
              <textarea
                name="colorNotes"
                defaultValue={glaze.colorNotes ?? ""}
                rows={2}
                className="border border-border px-2 py-1 text-xs"
              />
            </label>
            <label className="grid gap-1">
              Finish notes
              <textarea
                name="finishNotes"
                defaultValue={glaze.finishNotes ?? ""}
                rows={2}
                className="border border-border px-2 py-1 text-xs"
              />
            </label>
            <button
              type="submit"
              className="justify-self-start border border-border bg-panel px-3 py-1 text-[10px] uppercase tracking-[0.14em]"
            >
              Save edits
            </button>
          </form>
        </div>
      </details>
    </Panel>
  );
}

function FiringImageRow({
  img,
  state,
}: {
  img: ModerationFiringImage;
  state: ModState;
}) {
  return (
    <Panel className="space-y-0">
      <details>
        <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="font-medium">{img.label ?? "(no label)"}</span>
            <span className="text-xs text-muted">
              · {img.uploaderName} · {format(new Date(img.createdAt), "yyyy-MM-dd HH:mm")}
            </span>
          </span>
          <StateActions target="firingImage" id={img.id} state={state} />
        </summary>
        <div className="mt-3 flex gap-3">
          {img.imageUrl ? (
            <img
              src={img.imageUrl}
              alt=""
              className="h-24 w-24 border border-border object-cover"
            />
          ) : null}
          <div className="space-y-1 text-xs text-muted">
            <p>cone: {img.cone ?? "—"} · atmosphere: {img.atmosphere ?? "—"}</p>
            <p>
              Target:{" "}
              {img.glazeId
                ? `glaze ${img.glazeId.slice(0, 8)}`
                : img.combinationId
                ? `${img.combinationType} combination ${img.combinationId.slice(0, 8)}`
                : "—"}
            </p>
            <p className="font-mono text-[10px]">{img.id}</p>
          </div>
        </div>
        <form
          action={adminEditCommunityFiringImageAction}
          className="mt-3 grid gap-2 text-sm"
        >
          <input type="hidden" name="imageId" value={img.id} />
          <label className="grid gap-1">
            Label
            <input
              name="label"
              defaultValue={img.label ?? ""}
              className="border border-border px-2 py-1"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              Cone
              <input
                name="cone"
                defaultValue={img.cone ?? ""}
                className="border border-border px-2 py-1"
              />
            </label>
            <label className="grid gap-1">
              Atmosphere
              <input
                name="atmosphere"
                defaultValue={img.atmosphere ?? ""}
                className="border border-border px-2 py-1"
              />
            </label>
          </div>
          <button
            type="submit"
            className="justify-self-start border border-border bg-panel px-3 py-1 text-[10px] uppercase tracking-[0.14em]"
          >
            Save edits
          </button>
        </form>
      </details>
    </Panel>
  );
}

function Bucket({
  label,
  count,
  children,
  defaultOpen = false,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="space-y-2">
      <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.14em] text-muted">
        {label} ({count})
      </summary>
      <div className="mt-2 space-y-2">
        {count === 0 ? (
          <p className="text-xs text-muted">None.</p>
        ) : (
          children
        )}
      </div>
    </details>
  );
}

export default async function ModerationPage() {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) {
    redirect("/dashboard");
  }

  const { combinations, customGlazes, firingImages } = await getModerationQueue();

  const combos = partition(combinations);
  const glazes = partition(customGlazes);
  const imgs = partition(firingImages);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin · Moderation"
        title="Submission moderation"
        description="Review pending submissions. Approve to keep them, reject to void points and strike the author. Rejected items can be permanently deleted."
      />

      <p className="text-sm text-muted">
        <Link href="/admin/analytics" className="underline">
          ← Back to analytics dashboard
        </Link>
      </p>

      {/* ── Combinations ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Combinations ({combinations.length})
        </h2>
        <Bucket label="Pending" count={combos.pending.length} defaultOpen>
          {combos.pending.map((c) => (
            <CombinationRow key={c.id} combo={c} state="pending" />
          ))}
        </Bucket>
        <Bucket label="Approved" count={combos.approved.length}>
          {combos.approved.map((c) => (
            <CombinationRow key={c.id} combo={c} state="approved" />
          ))}
        </Bucket>
        <Bucket label="Rejected" count={combos.rejected.length}>
          {combos.rejected.map((c) => (
            <CombinationRow key={c.id} combo={c} state="rejected" />
          ))}
        </Bucket>
      </section>

      {/* ── Custom Glazes ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Custom glazes ({customGlazes.length})
        </h2>
        <Bucket label="Pending" count={glazes.pending.length} defaultOpen>
          {glazes.pending.map((g) => (
            <GlazeRow key={g.id} glaze={g} state="pending" />
          ))}
        </Bucket>
        <Bucket label="Approved" count={glazes.approved.length}>
          {glazes.approved.map((g) => (
            <GlazeRow key={g.id} glaze={g} state="approved" />
          ))}
        </Bucket>
        <Bucket label="Rejected" count={glazes.rejected.length}>
          {glazes.rejected.map((g) => (
            <GlazeRow key={g.id} glaze={g} state="rejected" />
          ))}
        </Bucket>
      </section>

      {/* ── Community Firing Images ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Community firing photos ({firingImages.length})
        </h2>
        <Bucket label="Pending" count={imgs.pending.length} defaultOpen>
          {imgs.pending.map((i) => (
            <FiringImageRow key={i.id} img={i} state="pending" />
          ))}
        </Bucket>
        <Bucket label="Approved" count={imgs.approved.length}>
          {imgs.approved.map((i) => (
            <FiringImageRow key={i.id} img={i} state="approved" />
          ))}
        </Bucket>
        <Bucket label="Rejected" count={imgs.rejected.length}>
          {imgs.rejected.map((i) => (
            <FiringImageRow key={i.id} img={i} state="rejected" />
          ))}
        </Bucket>
      </section>
    </div>
  );
}
