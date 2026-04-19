import { notFound, redirect } from "next/navigation";

import { updateInventoryItemAction } from "@/app/actions/inventory";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getInventoryItem } from "@/lib/data/inventory";
import { requireViewer } from "@/lib/data/users";
import { formatGlazeLabel, formatSearchQuery } from "@/lib/utils";

export default async function EditInventoryItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ inventoryId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const viewer = await requireViewer();

  const { inventoryId } = await params;
  const query = await searchParams;
  const item = await getInventoryItem(viewer.profile.id, inventoryId);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        tone="clay"
        eyebrow="Inventory"
        title={formatGlazeLabel(item.glaze)}
        description="Update private notes, archive the glaze, or refine details for a custom recipe entry that you created."
      />

      {formatSearchQuery(query.saved) ? (
        <div className="border border-accent-3/20 bg-accent-3/10 px-4 py-3 text-sm text-accent-3">
          Inventory details saved.
        </div>
      ) : null}

      <Panel>
        <form action={updateInventoryItemAction} className="grid gap-5">
          <input type="hidden" name="inventoryId" value={item.id} />

          {item.glaze.createdByUserId === viewer.profile.id ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium md:col-span-2">
                Name
                <Input name="name" defaultValue={item.glaze.name} required />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Brand or source
                <Input name="brand" defaultValue={item.glaze.brand ?? ""} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Line
                <Input name="line" defaultValue={item.glaze.line ?? ""} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Code
                <Input name="code" defaultValue={item.glaze.code ?? ""} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Cone
                <Input name="cone" defaultValue={item.glaze.cone ?? ""} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Atmosphere
                <Input name="atmosphere" defaultValue={item.glaze.atmosphere ?? ""} />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Finish notes
                <Input name="finishNotes" defaultValue={item.glaze.finishNotes ?? ""} />
              </label>
              <label className="grid gap-2 text-sm font-medium md:col-span-2">
                Color notes
                <Input name="colorNotes" defaultValue={item.glaze.colorNotes ?? ""} />
              </label>
              <label className="grid gap-2 text-sm font-medium md:col-span-2">
                Recipe notes
                <Textarea name="recipeNotes" defaultValue={item.glaze.recipeNotes ?? ""} />
              </label>
            </div>
          ) : item.glaze.description ? (
            <div className="border border-border bg-panel px-4 py-3 text-sm leading-6 text-muted">
              <p className="font-semibold text-foreground">Vendor description</p>
              <p className="mt-2">{item.glaze.description}</p>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-[0.7fr_1.3fr]">
            <label className="grid gap-2 text-sm font-medium">
              Status
              <Select name="status" defaultValue={item.status}>
                <option value="owned">Owned</option>
                <option value="archived">Archived</option>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Private notes
              <Textarea name="personalNotes" defaultValue={item.personalNotes ?? ""} />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={viewer.mode === "demo"}>
              Save changes
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
