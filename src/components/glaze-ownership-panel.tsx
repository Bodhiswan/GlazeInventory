"use client";

import { useState } from "react";

import { setGlazeInventoryStateAction } from "@/app/actions/inventory";
import { GlazeShelfForm } from "@/components/glaze-shelf-form";
import { InventoryFolderManager } from "@/components/inventory-folder-manager";
import { InventoryStatePicker } from "@/components/inventory-state-picker";
import type { InventoryCollectionState, InventoryFillLevel, InventoryFolder, InventoryStatus } from "@/lib/types";

export function GlazeOwnershipPanel({
  glazeId,
  initialStatus,
  initialFillLevel = "full",
  initialQuantity = 1,
  initialInventoryId = null,
  initialFolderIds = [],
  folders,
}: {
  glazeId: string;
  initialStatus: InventoryStatus | null;
  initialFillLevel?: InventoryFillLevel;
  initialQuantity?: number;
  initialInventoryId?: string | null;
  initialFolderIds?: string[];
  folders: InventoryFolder[];
}) {
  const [status, setStatus] = useState<InventoryCollectionState>(initialStatus ?? "none");
  const [inventoryId, setInventoryId] = useState<string | null>(initialInventoryId);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folderIds, setFolderIds] = useState(initialFolderIds);
  const isSaved = status !== "none";
  const isOwned = status === "owned";

  async function handleStatusChange(nextStatus: InventoryCollectionState) {
    const previousStatus = status;
    const previousInventoryId = inventoryId;

    setError(null);
    setPending(true);
    setStatus(nextStatus);

    const result = await setGlazeInventoryStateAction({
      glazeId,
      status: nextStatus,
    });

    if (!result.success) {
      setStatus(previousStatus);
      setInventoryId(previousInventoryId);
      setError(result.message);
      setPending(false);
      return;
    }

    setInventoryId(result.inventoryId ?? null);

    if (nextStatus === "none") {
      setFolderIds([]);
    }

    setPending(false);
  }

  return (
    <div className="space-y-4">
      <div className="border border-border bg-panel p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Save this glaze</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Put it on your shelf, save it to your wishlist, or mark it empty so it stays in your records without counting toward future combinations.
        </p>
        <div className="mt-4">
          <InventoryStatePicker
            status={status}
            showEmpty={status !== "none"}
            allowRemove={status !== "none"}
            onChange={(nextStatus) => {
              void handleStatusChange(nextStatus);
            }}
            pending={pending}
            error={error}
          />
        </div>
      </div>

      {isOwned ? (
        <GlazeShelfForm
          glazeId={glazeId}
          initialFillLevel={initialFillLevel}
          initialQuantity={initialQuantity}
        />
      ) : null}

      {isSaved && inventoryId ? (
        <InventoryFolderManager
          inventoryId={inventoryId}
          folders={folders}
          initialFolderIds={folderIds}
          onFolderIdsChange={setFolderIds}
        />
      ) : null}
    </div>
  );
}
