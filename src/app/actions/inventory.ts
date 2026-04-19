"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getInventory, getInventoryItem } from "@/lib/data/inventory";
import { serializeInventoryState } from "@/lib/inventory-state";
import { normalizeOptional, revalidateWorkspace, requireMemberSupabase } from "./_shared";

const catalogSchema = z.object({
  glazeId: z.string().uuid(),
  personalNotes: z.string().max(500).optional(),
  returnTo: z.string().min(1).max(200).optional(),
});

const glazeInventoryStateSchema = z.object({
  glazeId: z.string().uuid(),
  status: z.enum(["none", "owned", "wishlist", "archived"]),
});

const ownedGlazeShelfSchema = z.object({
  glazeId: z.string().uuid(),
  fillLevel: z.enum(["full", "half", "low"]),
  quantity: z.coerce.number().int().min(1).max(999),
  returnTo: z.string().min(1).max(200).optional(),
});

const inventoryEmptyToggleSchema = z.object({
  inventoryId: z.string().uuid(),
  empty: z.boolean(),
});

const inventoryNoteUpdateSchema = z.object({
  inventoryId: z.string().uuid(),
  personalNote: z.string().max(500).optional(),
});

const inventoryFolderCreateSchema = z.object({
  name: z.string().trim().min(2).max(40),
});

const inventoryFolderAssignmentSchema = z.object({
  inventoryId: z.string().uuid(),
  folderIds: z.array(z.string().uuid()).max(24),
});

export async function setGlazeInventoryStateAction(input: {
  glazeId: string;
  status: "none" | "owned" | "wishlist" | "archived";
}) {
  const { viewer, supabase } = await requireMemberSupabase("/glazes");
  const parsed = glazeInventoryStateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      message: "Could not update this glaze.",
    };
  }

  const inventory = await getInventory(viewer.profile.id);
  const existing = inventory.find((item) => item.glazeId === parsed.data.glazeId);

  if (parsed.data.status === "none") {
    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("user_id", viewer.profile.id)
      .eq("glaze_id", parsed.data.glazeId);

    if (error) {
      return {
        success: false as const,
        message: error.message,
      };
    }

    revalidateWorkspace();
    revalidatePath(`/glazes/${parsed.data.glazeId}`);

    return {
      success: true as const,
      status: "none" as const,
      inventoryId: null,
    };
  }

  const serializedState =
    serializeInventoryState({
      note: existing?.personalNotes ?? null,
      fillLevel: existing?.fillLevel ?? "full",
      quantity: existing?.quantity ?? 1,
    }) ?? null;

  const { data, error } = await supabase
    .from("inventory_items")
    .upsert(
      {
        user_id: viewer.profile.id,
        glaze_id: parsed.data.glazeId,
        status: parsed.data.status,
        personal_notes: serializedState,
      },
      { onConflict: "user_id,glaze_id" },
    )
    .select("id,status")
    .single();

  if (error || !data) {
    return {
      success: false as const,
      message: error?.message ?? "Could not update this glaze.",
    };
  }

  revalidateWorkspace();
  revalidatePath(`/glazes/${parsed.data.glazeId}`);

  return {
    success: true as const,
    status: parsed.data.status,
    inventoryId: String(data.id),
  };
}

export async function createInventoryFolderAction(input: { name: string }) {
  const { viewer, supabase } = await requireMemberSupabase("/inventory");
  const parsed = inventoryFolderCreateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      message: "Give the folder a short name.",
    };
  }

  const { data, error } = await supabase
    .from("inventory_folders")
    .insert({
      user_id: viewer.profile.id,
      name: parsed.data.name,
    })
    .select("id,user_id,name")
    .single();

  if (error || !data) {
    const errorMessage = error?.message ?? "Could not create that folder.";
    return {
      success: false as const,
      message:
        errorMessage.includes("inventory_folders_user_name_uidx")
          ? "You already have a folder with that name."
          : errorMessage,
    };
  }

  revalidateWorkspace();
  revalidatePath("/inventory");

  return {
    success: true as const,
    folder: {
      id: String(data.id),
      userId: String(data.user_id),
      name: String(data.name),
      glazeCount: 0,
    },
  };
}

export async function updateInventoryItemFoldersAction(input: {
  inventoryId: string;
  folderIds: string[];
}) {
  const { viewer, supabase } = await requireMemberSupabase("/inventory");
  const parsed = inventoryFolderAssignmentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      message: "Could not update folders.",
    };
  }

  const item = await getInventoryItem(viewer.profile.id, parsed.data.inventoryId);

  if (!item) {
    return {
      success: false as const,
      message: "Inventory item not found.",
    };
  }

  if (parsed.data.folderIds.length) {
    const { data: folderRows, error: folderError } = await supabase
      .from("inventory_folders")
      .select("id")
      .eq("user_id", viewer.profile.id)
      .in("id", parsed.data.folderIds);

    if (folderError || (folderRows ?? []).length !== parsed.data.folderIds.length) {
      return {
        success: false as const,
        message: folderError?.message ?? "One or more folders are unavailable.",
      };
    }
  }

  const { error: deleteError } = await supabase
    .from("inventory_item_folders")
    .delete()
    .eq("inventory_item_id", parsed.data.inventoryId);

  if (deleteError) {
    return {
      success: false as const,
      message: deleteError.message,
    };
  }

  if (parsed.data.folderIds.length) {
    const { error: insertError } = await supabase.from("inventory_item_folders").insert(
      parsed.data.folderIds.map((folderId) => ({
        inventory_item_id: parsed.data.inventoryId,
        folder_id: folderId,
      })),
    );

    if (insertError) {
      return {
        success: false as const,
        message: insertError.message,
      };
    }
  }

  revalidateWorkspace();
  revalidatePath("/inventory");
  revalidatePath(`/glazes/${item.glazeId}`);

  return {
    success: true as const,
    folderIds: parsed.data.folderIds,
  };
}

export async function addCatalogGlazeToInventoryAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/glazes");
  const parsed = catalogSchema.safeParse({
    glazeId: formData.get("glazeId"),
    personalNotes: normalizeOptional(formData.get("personalNotes")) ?? undefined,
    returnTo: normalizeOptional(formData.get("returnTo")) ?? undefined,
  });

  if (!parsed.success) {
    redirect("/glazes?error=Choose%20a%20catalog%20glaze");
  }

  const returnTo = parsed.data.returnTo ?? "/glazes";

  const { error } = await supabase.from("inventory_items").upsert(
    {
      user_id: viewer.profile.id,
      glaze_id: parsed.data.glazeId,
      status: "owned",
      personal_notes:
        serializeInventoryState({
          note: parsed.data.personalNotes ?? null,
          fillLevel: "full",
          quantity: 1,
        }) ?? null,
    },
    { onConflict: "user_id,glaze_id" },
  );

  if (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateWorkspace();
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function updateInventoryItemAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/inventory");
  const inventoryId = formData.get("inventoryId")?.toString();
  const status = formData.get("status")?.toString() === "archived" ? "archived" : "owned";

  if (!inventoryId) {
    redirect("/inventory?error=Missing%20inventory%20record");
  }

  const item = await getInventoryItem(viewer.profile.id, inventoryId);

  if (!item) {
    redirect("/inventory?error=Inventory%20record%20not%20found");
  }

  await supabase
    .from("inventory_items")
    .update({
      status,
      personal_notes:
        serializeInventoryState({
          note: normalizeOptional(formData.get("personalNotes")),
          fillLevel: item.fillLevel ?? "full",
          quantity: item.quantity ?? 1,
        }) ?? null,
    })
    .eq("id", inventoryId)
    .eq("user_id", viewer.profile.id);

  if (item.glaze.createdByUserId === viewer.profile.id) {
    await supabase
      .from("glazes")
      .update({
        name: formData.get("name")?.toString().trim(),
        brand: normalizeOptional(formData.get("brand")),
        line: normalizeOptional(formData.get("line")),
        code: normalizeOptional(formData.get("code")),
        cone: normalizeOptional(formData.get("cone")),
        atmosphere: normalizeOptional(formData.get("atmosphere")),
        finish_notes: normalizeOptional(formData.get("finishNotes")),
        color_notes: normalizeOptional(formData.get("colorNotes")),
        recipe_notes: normalizeOptional(formData.get("recipeNotes")),
      })
      .eq("id", item.glazeId)
      .eq("created_by_user_id", viewer.profile.id);
  }

  revalidateWorkspace();
  redirect(`/inventory/${inventoryId}/edit?saved=1`);
}

export async function toggleInventoryEmptyAction(input: { inventoryId: string; empty: boolean }) {
  const { viewer, supabase } = await requireMemberSupabase("/inventory");
  const parsed = inventoryEmptyToggleSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      message: "Could not update this glaze.",
    };
  }

  const item = await getInventoryItem(viewer.profile.id, parsed.data.inventoryId);

  if (!item) {
    return {
      success: false as const,
      message: "Inventory item not found.",
    };
  }

  const nextStatus = parsed.data.empty ? "archived" : item.status === "wishlist" ? "wishlist" : "owned";

  const { error } = await supabase
    .from("inventory_items")
    .update({
      status: nextStatus,
    })
    .eq("id", parsed.data.inventoryId)
    .eq("user_id", viewer.profile.id);

  if (error) {
    return {
      success: false as const,
      message: error.message,
    };
  }

  revalidateWorkspace();
  revalidatePath("/inventory");
  revalidatePath(`/glazes/${item.glazeId}`);

  return {
    success: true as const,
    empty: parsed.data.empty,
  };
}

export async function updateInventoryItemNotesAction(input: {
  inventoryId: string;
  personalNote?: string | null;
}) {
  const { viewer, supabase } = await requireMemberSupabase("/inventory");
  const parsed = inventoryNoteUpdateSchema.safeParse({
    inventoryId: input.inventoryId,
    personalNote: input.personalNote?.trim() || undefined,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      message: "Check the note before saving.",
    };
  }

  const item = await getInventoryItem(viewer.profile.id, parsed.data.inventoryId);

  if (!item) {
    return {
      success: false as const,
      message: "Inventory item not found.",
    };
  }

  const { error } = await supabase
    .from("inventory_items")
    .update({
      personal_notes:
        serializeInventoryState({
          note: parsed.data.personalNote ?? null,
          fillLevel: item.fillLevel ?? "full",
          quantity: item.quantity ?? 1,
        }) ?? null,
    })
    .eq("id", parsed.data.inventoryId)
    .eq("user_id", viewer.profile.id);

  if (error) {
    return {
      success: false as const,
      message: error.message,
    };
  }

  revalidateWorkspace();
  revalidatePath("/inventory");
  revalidatePath(`/glazes/${item.glazeId}`);

  return {
    success: true as const,
    personalNote: parsed.data.personalNote ?? null,
  };
}

export async function updateOwnedGlazeShelfAction(formData: FormData) {
  const parsed = ownedGlazeShelfSchema.safeParse({
    glazeId: formData.get("glazeId"),
    fillLevel: formData.get("fillLevel")?.toString(),
    quantity: formData.get("quantity"),
    returnTo: normalizeOptional(formData.get("returnTo")) ?? undefined,
  });

  const returnTo = parsed.success ? parsed.data.returnTo ?? "/glazes" : "/glazes";

  if (!parsed.success) {
    redirect(`${returnTo}?error=Check%20the%20shelf%20level%20and%20quantity`);
  }

  const result = await updateGlazeInventoryAmountAction({
    glazeId: parsed.data.glazeId,
    fillLevel: parsed.data.fillLevel,
    quantity: parsed.data.quantity,
  });

  if (!result.success) {
    redirect(`${returnTo}?error=${encodeURIComponent(result.message)}`);
  }

  revalidatePath(returnTo);
  redirect(`${returnTo}?saved=shelf`);
}

export async function updateGlazeInventoryAmountAction(input: {
  glazeId: string;
  fillLevel: "full" | "half" | "low";
  quantity: number;
}) {
  const { viewer, supabase } = await requireMemberSupabase("/glazes");
  const parsed = ownedGlazeShelfSchema.safeParse({
    glazeId: input.glazeId,
    fillLevel: input.fillLevel,
    quantity: input.quantity,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      message: "Check the amount left and quantity.",
    };
  }

  const inventory = await getInventory(viewer.profile.id);
  const existing = inventory.find((item) => item.glazeId === parsed.data.glazeId);

  const { error } = await supabase.from("inventory_items").upsert(
    {
      user_id: viewer.profile.id,
      glaze_id: parsed.data.glazeId,
      status: "owned",
      personal_notes:
        serializeInventoryState({
          note: existing?.personalNotes ?? null,
          fillLevel: parsed.data.fillLevel,
          quantity: parsed.data.quantity,
        }) ?? null,
    },
    { onConflict: "user_id,glaze_id" },
  );

  if (error) {
    return {
      success: false as const,
      message: error.message,
    };
  }

  revalidateWorkspace();
  revalidatePath(`/glazes/${parsed.data.glazeId}`);
  revalidatePath("/inventory");

  return {
    success: true as const,
    fillLevel: parsed.data.fillLevel,
    quantity: parsed.data.quantity,
  };
}
