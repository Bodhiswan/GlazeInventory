"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAllCatalogGlazes } from "@/lib/catalog";
import { getInventory, getInventoryItem } from "@/lib/data/inventory";
import { serializeInventoryState } from "@/lib/inventory-state";
import { CUSTOM_GLAZE_ATMOSPHERE_VALUES, CUSTOM_GLAZE_CONE_VALUES } from "@/lib/glaze-constants";
import { awardPoints } from "@/lib/points";
import { normalizeOptional, revalidateWorkspace, requireMemberSupabase, requireContributingMember } from "./_shared";

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

const customGlazeSchema = z.object({
  name: z.string().min(2).max(100),
  brand: z.string().max(80).optional(),
  line: z.string().max(80).optional(),
  code: z.string().max(40).optional(),
  cone: z.enum(CUSTOM_GLAZE_CONE_VALUES),
  atmosphere: z.enum(CUSTOM_GLAZE_ATMOSPHERE_VALUES).optional(),
  colors: z.string().max(500).optional(),
  finishes: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
  personalNotes: z.string().max(500).optional(),
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

export async function createCustomGlazeAction(formData: FormData) {
  const { viewer, supabase } = await requireContributingMember("/glazes/new");
  const returnTo = normalizeOptional(formData.get("returnTo")) ?? "/inventory";

  const parsed = customGlazeSchema.safeParse({
    name: formData.get("name")?.toString().trim(),
    brand: normalizeOptional(formData.get("brand")) ?? undefined,
    line: normalizeOptional(formData.get("line")) ?? undefined,
    code: normalizeOptional(formData.get("code")) ?? undefined,
    cone: formData.get("cone")?.toString().trim(),
    atmosphere: normalizeOptional(formData.get("atmosphere")) ?? undefined,
    colors: normalizeOptional(formData.get("colors")) ?? undefined,
    finishes: normalizeOptional(formData.get("finishes")) ?? undefined,
    notes: normalizeOptional(formData.get("notes")) ?? undefined,
    personalNotes: normalizeOptional(formData.get("personalNotes")) ?? undefined,
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Check the form for errors";
    redirect(`/glazes/new?error=${encodeURIComponent(firstIssue)}`);
  }

  const nameNorm = parsed.data.name.toLowerCase();
  const brandNorm = parsed.data.brand?.toLowerCase() ?? null;

  // Check against the static catalog for exact name+brand matches
  const catalogDupe = getAllCatalogGlazes().find(
    (g) =>
      g.name.toLowerCase() === nameNorm &&
      (g.brand?.toLowerCase() ?? null) === brandNorm,
  );
  if (catalogDupe) {
    redirect(
      `/glazes/new?error=${encodeURIComponent(`This glaze already exists in the catalog — search for "${parsed.data.name}" in the library`)}`,
    );
  }

  // Check the user's own custom glazes for exact duplicates
  const { data: existingCustom } = await supabase
    .from("glazes")
    .select("id,name,brand")
    .eq("source_type", "nonCommercial")
    .eq("created_by_user_id", viewer.profile.id)
    .ilike("name", parsed.data.name);

  const customDupe = (existingCustom ?? []).find(
    (row) => ((row.brand as string | null)?.toLowerCase() ?? null) === brandNorm,
  );
  if (customDupe) {
    redirect(
      `/glazes/new?error=${encodeURIComponent("You have already added a custom glaze with this name")}`,
    );
  }

  const { data: glaze, error: glazeError } = await supabase
    .from("glazes")
    .insert({
      source_type: "nonCommercial",
      name: parsed.data.name,
      brand: parsed.data.brand ?? null,
      line: parsed.data.line ?? null,
      code: parsed.data.code ?? null,
      cone: parsed.data.cone,
      atmosphere: parsed.data.atmosphere ?? null,
      color_notes: parsed.data.colors ?? null,
      finish_notes: [parsed.data.finishes, parsed.data.notes].filter(Boolean).join(". ") || null,
      created_by_user_id: viewer.profile.id,
    })
    .select("id")
    .single();

  if (glazeError || !glaze) {
    redirect(`/glazes/new?error=${encodeURIComponent(glazeError?.message ?? "Could not create glaze")}`);
  }

  // Track glaze creation event (fire and forget)
  void supabase.from("analytics_events").insert({
    event_type: "glaze_create",
    user_id: viewer.profile.id,
    glaze_id: null,
    metadata: { glaze_id: glaze.id, name: parsed.data.name, brand: parsed.data.brand ?? null },
  });

  const { error: inventoryError } = await supabase.from("inventory_items").insert({
    user_id: viewer.profile.id,
    glaze_id: glaze.id,
    status: "owned",
    personal_notes:
      serializeInventoryState({
        note: parsed.data.personalNotes ?? null,
        fillLevel: "full",
        quantity: 1,
      }) ?? null,
  });

  if (inventoryError) {
    redirect(`/glazes/new?error=${encodeURIComponent(inventoryError.message)}`);
  }

  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "glaze_added",
    10,
    glaze.id,
    "glaze",
  );

  // --- Upload image if provided ---
  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    if (imageFile.size > 5 * 1024 * 1024) {
      redirect(`/glazes/new?error=${encodeURIComponent("Image must be under 5MB")}`);
    }
    const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const imagePath = `${viewer.profile.id}/${crypto.randomUUID()}-${sanitize(imageFile.name)}`;
    const imageBuffer = new Uint8Array(await imageFile.arrayBuffer());
    const { error: uploadErr } = await supabase.storage
      .from("custom-glaze-images")
      .upload(imagePath, imageBuffer, { contentType: imageFile.type, upsert: false });
    if (!uploadErr) {
      const { data: publicData } = supabase.storage.from("custom-glaze-images").getPublicUrl(imagePath);
      await supabase.from("glaze_firing_images").insert({
        glaze_id: glaze.id,
        label: "Photo",
        image_url: publicData.publicUrl,
        sort_order: 0,
      });
    }
  }

  revalidateWorkspace();
  redirect(`${returnTo}?customGlazeAdded=1`);
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
