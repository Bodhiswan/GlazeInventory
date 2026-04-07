"use client";

import { useEffect, useMemo, useState } from "react";

import { createInventoryFolderAction, updateInventoryItemFoldersAction } from "@/app/actions/inventory";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InventoryFolder } from "@/lib/types";

export function InventoryFolderManager({
  inventoryId,
  folders,
  initialFolderIds,
  allowCreate = true,
  onFoldersChange,
  onFolderIdsChange,
}: {
  inventoryId: string;
  folders: InventoryFolder[];
  initialFolderIds: string[];
  allowCreate?: boolean;
  onFoldersChange?: (folders: InventoryFolder[]) => void;
  onFolderIdsChange?: (folderIds: string[]) => void;
}) {
  const [availableFolders, setAvailableFolders] = useState(folders);
  const [selectedFolderIds, setSelectedFolderIds] = useState(initialFolderIds);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedFolders = useMemo(
    () => availableFolders.filter((folder) => selectedFolderIds.includes(folder.id)),
    [availableFolders, selectedFolderIds],
  );

  useEffect(() => {
    setAvailableFolders(folders);
  }, [folders]);

  useEffect(() => {
    setSelectedFolderIds(initialFolderIds);
  }, [initialFolderIds]);

  async function saveFolderIds(nextFolderIds: string[]) {
    setPending(true);
    setError(null);
    setSelectedFolderIds(nextFolderIds);
    onFolderIdsChange?.(nextFolderIds);

    const result = await updateInventoryItemFoldersAction({
      inventoryId,
      folderIds: nextFolderIds,
    });

    if (!result.success) {
      setSelectedFolderIds(selectedFolderIds);
      onFolderIdsChange?.(selectedFolderIds);
      setError(result.message);
    }

    setPending(false);
  }

  async function createFolder() {
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Give the folder a short name.");
      return;
    }

    setPending(true);
    setError(null);

    const created = await createInventoryFolderAction({ name: trimmed });

    if (!created.success) {
      setPending(false);
      setError(created.message);
      return;
    }

    const nextFolders = [...availableFolders, created.folder].sort((left, right) =>
      left.name.localeCompare(right.name),
    );
    const nextSelected = [...selectedFolderIds, created.folder.id];

    setAvailableFolders(nextFolders);
    onFoldersChange?.(nextFolders);
    setName("");
    setSelectedFolderIds(nextSelected);
    onFolderIdsChange?.(nextSelected);

    const assigned = await updateInventoryItemFoldersAction({
      inventoryId,
      folderIds: nextSelected,
    });

    if (!assigned.success) {
      setSelectedFolderIds(selectedFolderIds);
      onFolderIdsChange?.(selectedFolderIds);
      setError(assigned.message);
    }

    setPending(false);
  }

  return (
    <div className="space-y-3 border border-border bg-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Folders</p>
        {pending ? <span className="text-xs text-muted">Saving…</span> : null}
      </div>

      {selectedFolders.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedFolders.map((folder) => (
            <Badge key={folder.id} tone="accent">
              {folder.name}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No folders yet. Add one if you want to group this glaze.</p>
      )}

      <details className="border border-border bg-white px-3 py-3">
        <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
          Organize folders
        </summary>
        <div className="mt-4 space-y-4">
          {availableFolders.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {availableFolders.map((folder) => {
                const checked = selectedFolderIds.includes(folder.id);

                return (
                  <label
                    key={folder.id}
                    className="flex cursor-pointer items-center gap-3 border border-border bg-panel px-3 py-2 text-sm text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={pending}
                      onChange={() => {
                        const nextIds = checked
                          ? selectedFolderIds.filter((folderId) => folderId !== folder.id)
                          : [...selectedFolderIds, folder.id];
                        void saveFolderIds(nextIds);
                      }}
                      className="h-4 w-4 rounded border-border accent-[#2d1c16]"
                    />
                    <span>{folder.name}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted">You have not created any folders yet.</p>
          )}

          {allowCreate ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Create a folder like Test tiles or Mug liners"
              />
              <button
                type="button"
                onClick={() => {
                  void createFolder();
                }}
                disabled={pending}
                className={buttonVariants({ size: "sm" })}
              >
                Create folder
              </button>
            </div>
          ) : null}
        </div>
      </details>

      {error ? <p className="text-xs text-[#7f4026]">{error}</p> : null}
    </div>
  );
}
