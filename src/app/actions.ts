"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getAllCatalogGlazes, getCatalogGlazeById } from "@/lib/catalog";
import { getCatalogGlazes, getInventory, getInventoryItem, requireViewer } from "@/lib/data";
import {
  buildAnonymizedCombinationAuthorName,
  canPublishExternalExampleIntake,
  getApprovedMatchedGlazeIds,
  resolveGlazeInput,
} from "@/lib/external-example-intakes";
import { getBaseUrl } from "@/lib/env";
import { serializeInventoryState } from "@/lib/inventory-state";
import { createPairKey, parsePairKey } from "@/lib/combinations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatGlazeLabel } from "@/lib/utils";
import { CUSTOM_GLAZE_ATMOSPHERE_VALUES, CUSTOM_GLAZE_CONE_VALUES } from "@/lib/glaze-constants";
import { awardPoints } from "@/lib/points";

const magicLinkSchema = z.object({
  email: z.email(),
});

const passwordSignInSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

const passwordSignUpSchema = z
  .object({
    displayName: z.string().min(2).max(40),
    email: z.email(),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const passwordResetRequestSchema = z.object({
  email: z.email(),
});

const passwordResetSchema = z
  .object({
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

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

const glazeTagVoteSchema = z.object({
  glazeId: z.string().uuid(),
  tagSlug: z.string().min(2).max(80),
  returnTo: z.string().min(1).max(200).optional(),
});

const glazeCommentSchema = z.object({
  glazeId: z.string().uuid(),
  body: z.string().min(2).max(1000),
  returnTo: z.string().min(1).max(200).optional(),
});

const glazeFavouriteSchema = z.object({
  glazeId: z.string().uuid(),
  returnTo: z.string().min(1).max(200).optional(),
});

const glazeDescriptionEditorSchema = z.object({
  glazeId: z.string().uuid(),
  editorialSummary: z.string().max(600).optional(),
  editorialSurface: z.string().max(280).optional(),
  editorialApplication: z.string().max(500).optional(),
  editorialFiring: z.string().max(280).optional(),
  returnTo: z.string().min(1).max(200).optional(),
});

const profilePreferencesSchema = z.object({
  displayName: z.string().min(2).max(40),
  studioName: z.string().max(80).optional(),
  location: z.string().max(80).optional(),
  preferredCone: z.string().max(40).optional(),
  preferredAtmosphere: z.string().max(40).optional(),
  restrictToPreferredExamples: z.boolean().optional(),
});

const externalExampleMatchSchema = z.object({
  mentionId: z.string().uuid(),
  intakeId: z.string().uuid(),
  matchInput: z.string().max(160).optional(),
  approved: z.boolean().optional(),
});

const externalExampleReviewNotesSchema = z.object({
  intakeId: z.string().uuid(),
  reviewNotes: z.string().max(2000).optional(),
});

const externalExampleStatusSchema = z.object({
  intakeId: z.string().uuid(),
  reviewStatus: z.enum(["queued", "approved", "rejected", "duplicate"]),
  duplicateOfIntakeId: z.string().uuid().optional(),
});

const externalExamplePublishSchema = z.object({
  intakeId: z.string().uuid(),
});

function normalizeOptional(value: FormDataEntryValue | null) {
  const normalized = value?.toString().trim();
  return normalized ? normalized : null;
}

function revalidateWorkspace() {
  [
    "/dashboard",
    "/inventory",
    "/glazes",
    "/inventory/new",
    "/glazes/new",
    "/combinations",
    "/community",
    "/publish",
    "/admin/moderation",
    "/admin/intake",
  ].forEach(
    (path) => revalidatePath(path),
  );
}

async function requireLiveSupabase() {
  const viewer = await requireViewer();

  if (viewer.mode === "demo") {
    redirect("/dashboard?demo=readonly");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/sign-in?error=Supabase%20is%20not%20configured");
  }

  return { viewer, supabase };
}

async function requireMemberSupabase(returnTo = "/auth/sign-in") {
  return requireLiveSupabase();
}

async function requireContributingMember(returnTo = "/contribute") {
  const context = await requireMemberSupabase(returnTo);
  if (context.viewer.profile.contributionsDisabled) {
    redirect(
      `${returnTo}?error=${encodeURIComponent(
        "Your contribution access has been disabled after repeated policy violations",
      )}`,
    );
  }
  return context;
}

async function requireAdminSupabase(returnTo = "/dashboard") {
  const context = await requireMemberSupabase(returnTo);

  if (!context.viewer.profile.isAdmin) {
    redirect(`${returnTo}?error=Studio%20admin%20access%20is%20required`);
  }

  return context;
}

function buildExternalExampleReturnPath(intakeId: string, suffix?: string) {
  const basePath = `/admin/intake/${intakeId}`;
  return suffix ? `${basePath}?${suffix}` : basePath;
}

function buildExternalExampleFiringSummary(parserOutput: unknown) {
  if (!parserOutput || typeof parserOutput !== "object") {
    return null;
  }

  const row = parserOutput as Record<string, unknown>;
  const parts = [row.extractedCone, row.extractedAtmosphere, row.extractedClayBody]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  return parts.length ? parts.join(" · ") : null;
}

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate") && lower.includes("limit") || lower.includes("too many") || lower.includes("exceeded")) {
    return "Too many attempts — please wait a minute and try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Check your inbox for a confirmation email before signing in.";
  }
  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  return message;
}

export async function sendMagicLinkAction(formData: FormData) {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email")?.toString().trim(),
  });

  if (!parsed.success) {
    redirect("/auth/sign-in?error=Enter%20a%20valid%20email");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/sign-in?error=Supabase%20is%20not%20configured");
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${getBaseUrl()}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/auth/sign-in?error=${encodeURIComponent(friendlyAuthError(error.message))}`);
  }

  redirect("/auth/sign-in?sent=1");
}

export async function signInWithPasswordAction(formData: FormData) {
  const returnTo = formData.get("returnTo")?.toString().trim() || null;
  const safeReturnTo = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";

  const parsed = passwordSignInSchema.safeParse({
    email: formData.get("email")?.toString().trim(),
    password: formData.get("password")?.toString(),
  });

  if (!parsed.success) {
    const errorUrl = returnTo
      ? `/auth/sign-in?error=Enter%20your%20email%20and%20password&redirectTo=${encodeURIComponent(returnTo)}`
      : "/auth/sign-in?error=Enter%20your%20email%20and%20password";
    redirect(errorUrl);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/sign-in?error=Supabase%20is%20not%20configured");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const msg = friendlyAuthError(error.message);
    const errorUrl = returnTo
      ? `/auth/sign-in?error=${encodeURIComponent(msg)}&redirectTo=${encodeURIComponent(returnTo)}`
      : `/auth/sign-in?error=${encodeURIComponent(msg)}`;
    redirect(errorUrl);
  }

  redirect(safeReturnTo);
}

export async function signUpWithPasswordAction(formData: FormData) {
  const parsed = passwordSignUpSchema.safeParse({
    displayName: formData.get("displayName")?.toString().trim(),
    email: formData.get("email")?.toString().trim(),
    password: formData.get("password")?.toString(),
    confirmPassword: formData.get("confirmPassword")?.toString(),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Check your account details";
    redirect(`/auth/sign-in?error=${encodeURIComponent(firstIssue)}`);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/sign-in?error=Supabase%20is%20not%20configured");
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getBaseUrl()}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
      data: {
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    redirect(`/auth/sign-in?error=${encodeURIComponent(friendlyAuthError(error.message))}`);
  }

  redirect("/auth/sign-in?registered=1");
}

export async function signOutAction() {
  const cookieStore = await (await import("next/headers")).cookies();
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut({ scope: "local" });
  }

  // Explicitly clear all Supabase auth cookies in case signOut didn't propagate
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name);
    }
  }

  redirect("/");
}

export async function sendPasswordResetAction(formData: FormData) {
  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email")?.toString().trim(),
  });

  if (!parsed.success) {
    redirect("/auth/forgot-password?error=Enter%20a%20valid%20email");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/forgot-password?error=Supabase%20is%20not%20configured");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getBaseUrl()}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
  });

  if (error) {
    redirect(`/auth/forgot-password?error=${encodeURIComponent(friendlyAuthError(error.message))}`);
  }

  redirect("/auth/forgot-password?sent=1");
}

export async function updatePasswordAction(formData: FormData) {
  const parsed = passwordResetSchema.safeParse({
    password: formData.get("password")?.toString(),
    confirmPassword: formData.get("confirmPassword")?.toString(),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "Check your new password";
    redirect(`/auth/reset-password?error=${encodeURIComponent(issue)}`);
  }

  const { supabase } = await requireLiveSupabase();

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    redirect(`/auth/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  revalidateWorkspace();
  redirect("/auth/sign-in?passwordReset=1");
}


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

  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "glaze_added",
    10,
    glaze.id,
    "glaze",
  );

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

export async function toggleOwnedGlazeAction(input: { glazeId: string; owned: boolean }) {
  const result = await setGlazeInventoryStateAction({
    glazeId: input.glazeId,
    status: input.owned ? "owned" : "none",
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true as const,
    owned: result.status === "owned",
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

export async function publishUserCombinationAction(formData: FormData) {
  const { viewer, supabase } = await requireContributingMember("/publish");

  // --- Parse layer glaze IDs (up to 4) ---
  const layerGlazeIds: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const glazeId = formData.get(`layer${i}GlazeId`)?.toString()?.trim();
    if (glazeId) layerGlazeIds.push(glazeId);
  }

  if (layerGlazeIds.length < 2) {
    redirect("/publish?error=Add%20at%20least%20two%20glaze%20layers%20before%20publishing");
  }

  // Validate glaze IDs: catalog glazes use static JSON IDs, custom glazes use DB IDs.
  // The layer table FK was dropped (see migration 20260407120000) because the DB assigns
  // different UUIDs to catalog glazes than the static JSON IDs used as identifiers.
  const allCatalogGlazes = getAllCatalogGlazes();
  const catalogGlazeMap = new Map(allCatalogGlazes.map((g) => [g.id, g]));

  const customGlazeIds = layerGlazeIds.filter((id) => !catalogGlazeMap.has(id));
  const customGlazeLabelMap = new Map<string, string>();

  if (customGlazeIds.length > 0) {
    const { data: dbCustomGlazes } = await supabase
      .from("glazes")
      .select("id, name, brand, source_type, created_by_user_id")
      .in("id", customGlazeIds);
    const dbCustomMap = new Map((dbCustomGlazes ?? []).map((g) => [g.id as string, g]));
    for (const glazeId of customGlazeIds) {
      const dbGlaze = dbCustomMap.get(glazeId);
      if (!dbGlaze || dbGlaze.source_type !== "nonCommercial" || dbGlaze.created_by_user_id !== viewer.profile.id) {
        redirect("/publish?error=One%20or%20more%20selected%20glazes%20could%20not%20be%20found");
      }
      customGlazeLabelMap.set(
        glazeId,
        [dbGlaze.brand, dbGlaze.name].filter(Boolean).join(" ") || String(dbGlaze.name),
      );
    }
  }

  // --- Cone ---
  const coneValue = formData.get("coneValue")?.toString() ?? "";
  const validConeValues = new Set(["Cone 06", "Cone 6", "Cone 10"]);
  if (!validConeValues.has(coneValue)) {
    redirect("/publish?error=Choose%20Cone%2006,%20Cone%206,%20or%20Cone%2010%20before%20publishing");
  }

  // --- Post-firing image (required) ---
  const postFiringFile = formData.get("postFiringImage");
  if (!(postFiringFile instanceof File) || !postFiringFile.size) {
    redirect("/publish?error=Upload%20a%20post-firing%20image");
  }
  if (!postFiringFile.type.startsWith("image/")) {
    redirect("/publish?error=Only%20image%20uploads%20are%20supported");
  }
  if (postFiringFile.size > 5 * 1024 * 1024) {
    redirect("/publish?error=Images%20must%20be%20under%205MB");
  }

  // --- Pre-firing image (optional) ---
  const preFiringFile = formData.get("preFiringImage");
  const hasPreFiringImage =
    preFiringFile instanceof File && preFiringFile.size > 0;
  if (hasPreFiringImage) {
    if (!preFiringFile.type.startsWith("image/")) {
      redirect("/publish?error=Only%20image%20uploads%20are%20supported");
    }
    if (preFiringFile.size > 5 * 1024 * 1024) {
      redirect("/publish?error=Images%20must%20be%20under%205MB");
    }
  }

  // --- Upload post-firing image ---
  const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9.-]/g, "-");
  const postFiringPath = `${viewer.profile.id}/${crypto.randomUUID()}-${sanitize(postFiringFile.name)}`;
  const postFiringBuffer = new Uint8Array(await postFiringFile.arrayBuffer());

  const { error: postUpErr } = await supabase.storage
    .from("user-combination-images")
    .upload(postFiringPath, postFiringBuffer, {
      contentType: postFiringFile.type,
      upsert: false,
    });

  if (postUpErr) {
    redirect(`/publish?error=${encodeURIComponent(postUpErr.message)}`);
  }

  const { data: postFiringPublic } = supabase.storage
    .from("user-combination-images")
    .getPublicUrl(postFiringPath);

  // --- Upload pre-firing image (if provided) ---
  let preFiringPublicUrl: string | null = null;

  if (hasPreFiringImage) {
    const preFiringPath = `${viewer.profile.id}/${crypto.randomUUID()}-${sanitize(preFiringFile.name)}`;
    const preFiringBuffer = new Uint8Array(await preFiringFile.arrayBuffer());

    const { error: preUpErr } = await supabase.storage
      .from("user-combination-images")
      .upload(preFiringPath, preFiringBuffer, {
        contentType: preFiringFile.type,
        upsert: false,
      });

    if (preUpErr) {
      redirect(`/publish?error=${encodeURIComponent(preUpErr.message)}`);
    }

    const { data: preFiringPublic } = supabase.storage
      .from("user-combination-images")
      .getPublicUrl(preFiringPath);
    preFiringPublicUrl = preFiringPublic.publicUrl;
  }

  // --- Build title from glaze labels ---
  const glazeLabels = layerGlazeIds.map((gid) => {
    const catalogGlaze = catalogGlazeMap.get(gid);
    if (catalogGlaze) return formatGlazeLabel(catalogGlaze);
    return customGlazeLabelMap.get(gid) ?? "Glaze";
  });
  const title =
    glazeLabels.length === 2
      ? `${glazeLabels[0]} over ${glazeLabels[1]}`
      : glazeLabels.join(" / ");

  // --- Insert example row ---
  const { data: exampleRow, error: insertErr } = await supabase
    .from("user_combination_examples")
    .insert({
      author_user_id: viewer.profile.id,
      title,
      post_firing_image_path: postFiringPublic.publicUrl,
      pre_firing_image_path: preFiringPublicUrl,
      cone: coneValue,
      atmosphere: normalizeOptional(formData.get("atmosphere")) ?? "oxidation",
      glazing_process: normalizeOptional(formData.get("glazingProcess")),
      notes: normalizeOptional(formData.get("notes")),
      kiln_notes: normalizeOptional(formData.get("kilnNotes")),
      visibility: "members",
      status: "published",
    })
    .select("id")
    .single();

  if (insertErr || !exampleRow) {
    redirect(`/publish?error=${encodeURIComponent(insertErr?.message ?? "Could not save example")}`);
  }

  // --- Insert layers ---
  const layerRows = layerGlazeIds.map((glazeId, index) => ({
    example_id: exampleRow.id,
    glaze_id: glazeId,
    layer_order: index + 1,
  }));

  const { error: layerErr } = await supabase
    .from("user_combination_example_layers")
    .insert(layerRows);

  if (layerErr) {
    // Clean up the parent row if layers fail
    await supabase.from("user_combination_examples").delete().eq("id", exampleRow.id);
    redirect(`/publish?error=${encodeURIComponent(layerErr.message)}`);
  }

  // Track combination publish event (fire and forget)
  void supabase.from("analytics_events").insert({
    event_type: "combination_publish",
    user_id: viewer.profile.id,
    glaze_id: null,
    metadata: { example_id: exampleRow.id, title, layer_count: layerGlazeIds.length, cone: coneValue },
  });

  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "combination_shared",
    5,
    exampleRow.id,
    "combination",
  );

  revalidateWorkspace();
  redirect("/combinations?view=mine&published=1");
}

export async function deleteUserCombinationAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/combinations");
  const exampleId = formData.get("exampleId")?.toString();

  if (!exampleId) {
    redirect("/combinations?error=Missing%20example%20id");
  }

  // Verify ownership (RLS enforces this too, but be explicit)
  const { data: example } = await supabase
    .from("user_combination_examples")
    .select("id, author_user_id, post_firing_image_path, pre_firing_image_path")
    .eq("id", exampleId)
    .single();

  if (!example) {
    redirect("/combinations?error=Example%20not%20found");
  }

  if (example.author_user_id !== viewer.profile.id && !viewer.profile.isAdmin) {
    redirect("/combinations?error=You%20can%20only%20archive%20your%20own%20examples");
  }

  // Archive instead of delete — admins can still view archived items
  await supabase
    .from("user_combination_examples")
    .update({ status: "hidden" })
    .eq("id", exampleId);

  revalidateWorkspace();
  redirect("/combinations?view=mine");
}

export async function reportPostAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/community");
  const postId = formData.get("postId")?.toString();
  const reason = normalizeOptional(formData.get("reason"));
  const pairKey = formData.get("pairKey")?.toString() ?? "";

  if (!postId || !reason) {
    redirect(`/community?error=Add%20a%20reason%20when%20reporting%20a%20post`);
  }

  const { error } = await supabase.from("reports").insert({
    post_id: postId,
    reported_by_user_id: viewer.profile.id,
    reason,
    status: "open",
  });

  if (!error) {
    await supabase
      .from("combination_posts")
      .update({ status: "reported" })
      .eq("id", postId)
      .eq("status", "published");
  }

  revalidateWorkspace();
  redirect(pairKey ? `/combinations/${pairKey}?reported=1` : "/community?reported=1");
}

export async function moderatePostAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/dashboard");

  if (!viewer.profile.isAdmin) {
    redirect("/dashboard");
  }

  const postId = formData.get("postId")?.toString();
  const status = formData.get("status")?.toString() === "published" ? "published" : "hidden";

  if (!postId) {
    redirect("/admin/moderation?error=Missing%20post%20id");
  }

  await supabase.from("combination_posts").update({ status }).eq("id", postId);
  await supabase.from("reports").update({ status: "resolved" }).eq("post_id", postId);

  revalidateWorkspace();
  redirect("/admin/moderation?saved=1");
}

export async function updateExternalExampleGlazeMatchAction(formData: FormData) {
  const { viewer, supabase } = await requireAdminSupabase("/admin/intake");
  const parsed = externalExampleMatchSchema.safeParse({
    mentionId: formData.get("mentionId")?.toString(),
    intakeId: formData.get("intakeId")?.toString(),
    matchInput: normalizeOptional(formData.get("matchInput")) ?? undefined,
    approved: formData.get("approved") === "on",
  });

  const fallbackPath = parsed.success
    ? buildExternalExampleReturnPath(parsed.data.intakeId)
    : "/admin/intake";

  if (!parsed.success) {
    redirect(`${fallbackPath}?error=Check%20the%20glaze%20match%20before%20saving`);
  }

  const glazes = await getCatalogGlazes(viewer.profile.id);
  const matchedGlaze = parsed.data.matchInput
    ? resolveGlazeInput(glazes, parsed.data.matchInput)
    : null;
  const shouldApprove = Boolean(parsed.data.approved && matchedGlaze);

  const { error } = await supabase
    .from("external_example_glaze_mentions")
    .update({
      matched_glaze_id: matchedGlaze?.id ?? null,
      is_approved: shouldApprove,
      approved_by_user_id: shouldApprove ? viewer.profile.id : null,
      approved_at: shouldApprove ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.mentionId)
    .eq("intake_id", parsed.data.intakeId);

  if (error) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateWorkspace();
  revalidatePath(buildExternalExampleReturnPath(parsed.data.intakeId));
  redirect(`${buildExternalExampleReturnPath(parsed.data.intakeId)}?saved=match`);
}

export async function updateExternalExampleReviewNotesAction(formData: FormData) {
  const { supabase } = await requireAdminSupabase("/admin/intake");
  const parsed = externalExampleReviewNotesSchema.safeParse({
    intakeId: formData.get("intakeId")?.toString(),
    reviewNotes: normalizeOptional(formData.get("reviewNotes")) ?? undefined,
  });

  const fallbackPath = parsed.success
    ? buildExternalExampleReturnPath(parsed.data.intakeId)
    : "/admin/intake";

  if (!parsed.success) {
    redirect(`${fallbackPath}?error=Check%20the%20review%20notes%20before%20saving`);
  }

  const { error } = await supabase
    .from("external_example_intakes")
    .update({
      review_notes: parsed.data.reviewNotes ?? null,
    })
    .eq("id", parsed.data.intakeId);

  if (error) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateWorkspace();
  revalidatePath(buildExternalExampleReturnPath(parsed.data.intakeId));
  redirect(`${buildExternalExampleReturnPath(parsed.data.intakeId)}?saved=notes`);
}

export async function setExternalExampleIntakeStatusAction(formData: FormData) {
  const { supabase } = await requireAdminSupabase("/admin/intake");
  const parsed = externalExampleStatusSchema.safeParse({
    intakeId: formData.get("intakeId")?.toString(),
    reviewStatus: formData.get("reviewStatus")?.toString(),
    duplicateOfIntakeId: normalizeOptional(formData.get("duplicateOfIntakeId")) ?? undefined,
  });

  const fallbackPath = parsed.success
    ? buildExternalExampleReturnPath(parsed.data.intakeId)
    : "/admin/intake";

  if (!parsed.success) {
    redirect(`${fallbackPath}?error=Choose%20a%20valid%20review%20status`);
  }

  const { error } = await supabase
    .from("external_example_intakes")
    .update({
      review_status: parsed.data.reviewStatus,
      duplicate_of_intake_id:
        parsed.data.reviewStatus === "duplicate" ? parsed.data.duplicateOfIntakeId ?? null : null,
    })
    .eq("id", parsed.data.intakeId);

  if (error) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateWorkspace();
  revalidatePath(buildExternalExampleReturnPath(parsed.data.intakeId));
  redirect(`${buildExternalExampleReturnPath(parsed.data.intakeId)}?saved=status`);
}

export async function publishExternalExampleIntakeAction(formData: FormData) {
  const { viewer, supabase } = await requireAdminSupabase("/admin/intake");
  const parsed = externalExamplePublishSchema.safeParse({
    intakeId: formData.get("intakeId")?.toString(),
  });

  const fallbackPath = parsed.success
    ? buildExternalExampleReturnPath(parsed.data.intakeId)
    : "/admin/intake";

  if (!parsed.success) {
    redirect(`${fallbackPath}?error=Missing%20intake%20record`);
  }

  const admin = createSupabaseAdminClient();

  if (!admin) {
    redirect(`${fallbackPath}?error=Supabase%20service%20role%20is%20required%20for%20publishing`);
  }

  const { data: intake, error: intakeError } = await supabase
    .from("external_example_intakes")
    .select("*, external_example_assets(*), external_example_glaze_mentions(*)")
    .eq("id", parsed.data.intakeId)
    .maybeSingle();

  if (intakeError || !intake) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(intakeError?.message ?? "Intake not found")}`);
  }

  const reviewStatus = String(intake.review_status ?? "queued");

  if (reviewStatus === "duplicate" || reviewStatus === "rejected" || reviewStatus === "published") {
    redirect(`${fallbackPath}?error=This%20intake%20cannot%20be%20published%20from%20its%20current%20status`);
  }

  const mentionSummaries = ((intake.external_example_glaze_mentions ?? []) as Array<Record<string, unknown>>).map((mention) => ({
    matchedGlazeId: (mention.matched_glaze_id as string | null) ?? null,
    isApproved: Boolean(mention.is_approved),
  }));
  const approvedMentionGlazeIds = getApprovedMatchedGlazeIds(mentionSummaries);

  if (
    !canPublishExternalExampleIntake(reviewStatus, mentionSummaries)
  ) {
    redirect(`${fallbackPath}?error=Exactly%20two%20approved%20glaze%20matches%20are%20required%20to%20publish`);
  }

  const primaryAsset = ((intake.external_example_assets ?? []) as Array<Record<string, unknown>>)
    .sort((left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0))[0];

  if (!primaryAsset?.storage_path) {
    redirect(`${fallbackPath}?error=This%20intake%20does%20not%20have%20an%20archived%20image%20to%20publish`);
  }

  const { data: assetBlob, error: assetError } = await admin.storage
    .from("external-example-imports")
    .download(String(primaryAsset.storage_path));

  if (assetError || !assetBlob) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(assetError?.message ?? "Could not download archived image")}`);
  }

  const pairKey = createPairKey(approvedMentionGlazeIds[0]!, approvedMentionGlazeIds[1]!);
  const orderedGlazeIds = parsePairKey(pairKey);
  const uploadedPath = `${viewer.profile.id}/external-intakes/${crypto.randomUUID()}-${String(primaryAsset.storage_path).split("/").pop()}`;

  const uploadBuffer = new Uint8Array(await assetBlob.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from("glaze-posts")
    .upload(uploadedPath, uploadBuffer, {
      contentType: assetBlob.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(uploadError.message)}`);
  }

  const { data: publicData } = admin.storage.from("glaze-posts").getPublicUrl(uploadedPath);
  const { data: pairRecord, error: pairError } = await supabase
    .from("combination_pairs")
    .upsert(
      {
        glaze_a_id: orderedGlazeIds?.[0],
        glaze_b_id: orderedGlazeIds?.[1],
        pair_key: pairKey,
      },
      { onConflict: "pair_key" },
    )
    .select("id")
    .single();

  if (pairError || !pairRecord) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(pairError?.message ?? "Could not create combination pair")}`);
  }

  const { data: postRecord, error: postError } = await supabase
    .from("combination_posts")
    .insert({
      author_user_id: viewer.profile.id,
      display_author_name: buildAnonymizedCombinationAuthorName(String(intake.source_platform ?? "facebook")),
      combination_pair_id: pairRecord.id,
      image_path: publicData.publicUrl,
      caption: (intake.raw_caption as string | null) ?? null,
      application_notes: (intake.review_notes as string | null) ?? null,
      firing_notes: buildExternalExampleFiringSummary(intake.parser_output),
      visibility: "members",
      status: "published",
    })
    .select("id")
    .single();

  if (postError || !postRecord) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(postError?.message ?? "Could not publish archive post")}`);
  }

  const { error: updateError } = await supabase
    .from("external_example_intakes")
    .update({
      review_status: "published",
      published_post_id: postRecord.id,
      published_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.intakeId);

  if (updateError) {
    redirect(`${fallbackPath}?error=${encodeURIComponent(updateError.message)}`);
  }

  revalidateWorkspace();
  revalidatePath(buildExternalExampleReturnPath(parsed.data.intakeId));
  revalidatePath(`/combinations/${pairKey}`);
  redirect(`${buildExternalExampleReturnPath(parsed.data.intakeId)}?published=1`);
}

export async function toggleGlazeTagVoteAction(formData: FormData) {
  const { viewer, supabase } = await requireContributingMember("/glazes");
  const parsed = glazeTagVoteSchema.safeParse({
    glazeId: formData.get("glazeId"),
    tagSlug: formData.get("tagSlug")?.toString().trim(),
    returnTo: normalizeOptional(formData.get("returnTo")) ?? undefined,
  });

  const returnTo = parsed.success ? parsed.data.returnTo ?? "/community" : "/community";

  if (!parsed.success) {
    redirect(returnTo);
  }

  const { data: glaze } = await supabase
    .from("glazes")
    .select("id,source_type")
    .eq("id", parsed.data.glazeId)
    .maybeSingle();

  if (!glaze || glaze.source_type !== "commercial") {
    redirect(returnTo);
  }

  const { data: tag } = await supabase
    .from("glaze_tags")
    .select("id")
    .eq("slug", parsed.data.tagSlug)
    .maybeSingle();

  if (!tag) {
    redirect(returnTo);
  }

  const { data: existingVote } = await supabase
    .from("glaze_tag_votes")
    .select("id")
    .eq("glaze_id", parsed.data.glazeId)
    .eq("tag_id", tag.id)
    .eq("user_id", viewer.profile.id)
    .maybeSingle();

  if (existingVote) {
    await supabase.from("glaze_tag_votes").delete().eq("id", existingVote.id);
  } else {
    await supabase.from("glaze_tag_votes").insert({
      glaze_id: parsed.data.glazeId,
      tag_id: tag.id,
      user_id: viewer.profile.id,
    });

    void awardPoints(
      viewer.profile.id,
      viewer.profile.isAdmin ?? false,
      "tag_voted",
      0.1,
      undefined,
      "tag_vote",
    );
  }

  revalidateWorkspace();
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function addGlazeCommentInlineAction(
  glazeId: string,
  body: string,
): Promise<{ error?: string; authorName?: string }> {
  const { viewer, supabase } = await requireMemberSupabase("/glazes");
  const trimmed = body.trim();
  if (trimmed.length < 2) return { error: "Comment must be at least 2 characters." };
  if (trimmed.length > 1000) return { error: "Comment must be under 1000 characters." };

  const { error } = await supabase.from("glaze_comments").insert({
    glaze_id: glazeId,
    author_user_id: viewer.profile.id,
    body: trimmed,
  });

  if (error) return { error: error.message };

  revalidateWorkspace();
  return { authorName: viewer.profile.displayName };
}

export async function addCombinationCommentInlineAction(
  exampleId: string,
  body: string,
): Promise<{ error?: string; authorName?: string }> {
  const { viewer, supabase } = await requireMemberSupabase("/combinations");
  if (viewer.profile.contributionsDisabled) {
    return { error: "Your contribution access has been disabled" };
  }
  const trimmed = body.trim();
  if (trimmed.length < 2) return { error: "Comment must be at least 2 characters." };
  if (trimmed.length > 1000) return { error: "Comment must be under 1000 characters." };

  const { error } = await supabase.from("combination_comments").insert({
    example_id: exampleId,
    author_user_id: viewer.profile.id,
    body: trimmed,
  });

  if (error) return { error: error.message };

  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "comment_left",
    0.1,
    undefined,
    "comment",
  );

  revalidateWorkspace();
  return { authorName: viewer.profile.displayName };
}

export async function addGlazeCommentAction(formData: FormData) {
  const { viewer, supabase } = await requireContributingMember("/glazes");
  const parsed = glazeCommentSchema.safeParse({
    glazeId: formData.get("glazeId"),
    body: formData.get("body")?.toString().trim(),
    returnTo: normalizeOptional(formData.get("returnTo")) ?? undefined,
  });

  const returnTo = parsed.success ? parsed.data.returnTo ?? "/glazes" : "/glazes";

  if (!parsed.success) {
    redirect(`${returnTo}?error=Write%20a%20short%20comment%20before%20posting`);
  }

  const { error } = await supabase.from("glaze_comments").insert({
    glaze_id: parsed.data.glazeId,
    author_user_id: viewer.profile.id,
    body: parsed.data.body,
  });

  if (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  }

  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "comment_left",
    0.1,
    undefined,
    "comment",
  );

  revalidateWorkspace();
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function toggleFavouriteInlineAction(
  targetType: "glaze" | "combination",
  targetId: string,
): Promise<{ favourited: boolean; error?: string }> {
  const { viewer, supabase } = await requireMemberSupabase("/glazes");

  const { data: existing } = await supabase
    .from("user_favourites")
    .select("id")
    .eq("user_id", viewer.profile.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .limit(1)
    .single();

  if (existing) {
    const { error } = await supabase.from("user_favourites").delete().eq("id", existing.id);
    if (error) return { favourited: true, error: error.message };
    revalidateWorkspace();
    return { favourited: false };
  } else {
    const { error } = await supabase.from("user_favourites").insert({
      user_id: viewer.profile.id,
      target_type: targetType,
      target_id: targetId,
    });
    if (error) return { favourited: false, error: error.message };
    revalidateWorkspace();
    return { favourited: true };
  }
}

export async function toggleGlazeFavouriteAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/glazes");
  const parsed = glazeFavouriteSchema.safeParse({
    glazeId: formData.get("glazeId"),
    returnTo: normalizeOptional(formData.get("returnTo")) ?? undefined,
  });

  const returnTo = parsed.success ? parsed.data.returnTo ?? "/glazes" : "/glazes";

  if (!parsed.success) {
    redirect(returnTo);
  }

  const { data: existing } = await supabase
    .from("user_favourites")
    .select("id")
    .eq("user_id", viewer.profile.id)
    .eq("target_type", "glaze")
    .eq("target_id", parsed.data.glazeId)
    .limit(1)
    .single();

  if (existing) {
    await supabase.from("user_favourites").delete().eq("id", existing.id);
  } else {
    await supabase.from("user_favourites").insert({
      user_id: viewer.profile.id,
      target_type: "glaze",
      target_id: parsed.data.glazeId,
    });
  }

  revalidateWorkspace();
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function updateGlazeDescriptionAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/glazes");
  const parsed = glazeDescriptionEditorSchema.safeParse({
    glazeId: formData.get("glazeId"),
    editorialSummary: normalizeOptional(formData.get("editorialSummary")) ?? undefined,
    editorialSurface: normalizeOptional(formData.get("editorialSurface")) ?? undefined,
    editorialApplication: normalizeOptional(formData.get("editorialApplication")) ?? undefined,
    editorialFiring: normalizeOptional(formData.get("editorialFiring")) ?? undefined,
    returnTo: normalizeOptional(formData.get("returnTo")) ?? undefined,
  });

  const returnTo = parsed.success ? parsed.data.returnTo ?? "/glazes" : "/glazes";

  if (!viewer.profile.isAdmin) {
    redirect(`${returnTo}?error=Only%20admins%20can%20edit%20catalog%20descriptions`);
  }

  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "Check the description fields";
    redirect(`${returnTo}?error=${encodeURIComponent(issue)}`);
  }

  const hasEditorialContent = Boolean(
    parsed.data.editorialSummary ||
      parsed.data.editorialSurface ||
      parsed.data.editorialApplication ||
      parsed.data.editorialFiring,
  );

  const { error } = await supabase
    .from("glazes")
    .update({
      editorial_summary: parsed.data.editorialSummary ?? null,
      editorial_surface: parsed.data.editorialSurface ?? null,
      editorial_application: parsed.data.editorialApplication ?? null,
      editorial_firing: parsed.data.editorialFiring ?? null,
      editorial_reviewed_at: hasEditorialContent ? new Date().toISOString() : null,
      editorial_reviewed_by_user_id: hasEditorialContent ? viewer.profile.id : null,
    })
    .eq("id", parsed.data.glazeId);

  if (error) {
    redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  }

  revalidateWorkspace();
  revalidatePath(`/glazes/${parsed.data.glazeId}`);
  revalidatePath("/glazes");
  redirect(`${returnTo}?saved=description`);
}

export async function updateProfilePreferencesAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/profile");
  const parsed = profilePreferencesSchema.safeParse({
    displayName: formData.get("displayName")?.toString().trim(),
    studioName: normalizeOptional(formData.get("studioName")) ?? undefined,
    location: normalizeOptional(formData.get("location")) ?? undefined,
    preferredCone: normalizeOptional(formData.get("preferredCone")) ?? undefined,
    preferredAtmosphere: normalizeOptional(formData.get("preferredAtmosphere")) ?? undefined,
    restrictToPreferredExamples: formData.get("restrictToPreferredExamples") === "on",
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? "Check your profile details";
    redirect(`/profile?error=${encodeURIComponent(issue)}`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      studio_name: parsed.data.studioName ?? null,
      location: parsed.data.location ?? null,
      preferred_cone: parsed.data.preferredCone ?? null,
      preferred_atmosphere: parsed.data.preferredAtmosphere ?? null,
      restrict_to_preferred_examples: Boolean(parsed.data.restrictToPreferredExamples),
    })
    .eq("id", viewer.profile.id);

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidateWorkspace();
  revalidatePath("/profile");
  redirect("/profile?saved=1");
}

/** Return lightweight catalog glaze data for the label scanner. */
export async function getCatalogGlazesForScannerAction() {
  return getAllCatalogGlazes().map((g) => ({
    id: g.id,
    brand: g.brand ?? null,
    code: g.code ?? null,
    name: g.name,
    line: g.line ?? null,
    imageUrl: g.imageUrl ?? null,
  }));
}

/** Use Gemini Vision to read a glaze label from a photo. */
export async function recognizeGlazeLabelAction(input: {
  imageBase64: string;
  mimeType: string;
}): Promise<{
  success: boolean;
  brand: string | null;
  code: string | null;
  name: string | null;
  line: string | null;
  rawText: string | null;
  error: string | null;
}> {
  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, brand: null, code: null, name: null, line: null, rawText: null, error: "Vision API not configured." };
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: input.mimeType,
            data: input.imageBase64,
          },
        },
        {
          text: `You are looking at a photo of a ceramic glaze bottle or label. Extract the following information and return ONLY valid JSON with no markdown formatting:

{
  "brand": "the manufacturer (e.g. Mayco, AMACO, Coyote, Spectrum, Duncan, Speedball)",
  "code": "the product code (e.g. CG-718, SW-116, LG-10, HF-26)",
  "name": "the color/glaze name (e.g. Blue Caprice, Sea Salt)",
  "line": "the product line (e.g. Jungle Gems, Stoneware, Elements, Sahara)"
}

If you cannot determine a field, set it to null. Focus on reading the product code — it's the most important identifier. Look for patterns like 2-3 letters followed by a dash and numbers.`,
        },
      ],
    });

    const text = response.text?.trim() ?? "";

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) jsonStr = fenced[1].trim();

    const parsed = JSON.parse(jsonStr);

    return {
      success: true,
      brand: parsed.brand ?? null,
      code: parsed.code ?? null,
      name: parsed.name ?? null,
      line: parsed.line ?? null,
      rawText: text,
      error: null,
    };
  } catch (e) {
    return {
      success: false,
      brand: null,
      code: null,
      name: null,
      line: null,
      rawText: null,
      error: e instanceof Error ? e.message : "Failed to read label.",
    };
  }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function trackBuyClickAction(formData: FormData): Promise<void> {
  const glazeId = formData.get("glazeId") as string | null;
  const storeId = formData.get("storeId") as string | null;
  const storeName = formData.get("storeName") as string | null;
  const url = formData.get("url") as string | null;

  if (!url) return;

  const supabase = await createSupabaseServerClient();
  if (!supabase) { redirect(url); }
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("analytics_events").insert({
    event_type: "buy_click",
    user_id: user?.id ?? null,
    glaze_id: glazeId || null,
    metadata: { store_id: storeId, store_name: storeName, url },
  });

  redirect(url);
}

// ─── Admin moderation ─────────────────────────────────────────────────────────

export async function adminArchiveCombinationAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) { redirect("/dashboard"); }

  const exampleId = formData.get("exampleId") as string | null;
  const action = formData.get("action") as string | null; // "archive" | "restore"
  if (!exampleId || !action) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  await admin
    .from("user_combination_examples")
    .update({ status: action === "archive" ? "hidden" : "published" })
    .eq("id", exampleId);

  revalidatePath("/admin/analytics");
  revalidatePath("/combinations");
}

export async function adminDeleteCustomGlazeAction(formData: FormData): Promise<void> {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) { redirect("/dashboard"); }

  const glazeId = formData.get("glazeId") as string | null;
  if (!glazeId) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  // Safety check — only delete custom glazes
  const { data: glaze } = await admin
    .from("glazes")
    .select("source_type")
    .eq("id", glazeId)
    .single();

  if (!glaze || (glaze as Record<string, unknown>).source_type !== "nonCommercial") return;

  await admin.from("glazes").delete().eq("id", glazeId);

  revalidatePath("/admin/analytics");
}

export async function uploadCommunityFiringImageAction(formData: FormData): Promise<{ error: string } | { success: true }> {
  const { viewer, supabase } = await requireContributingMember("/contribute/firing-image");

  const imageFile = formData.get("image");
  if (!(imageFile instanceof File) || imageFile.size === 0) return { error: "No image provided" };
  if (imageFile.size > 8 * 1024 * 1024) return { error: "Image must be under 8 MB" };

  const glazeId = (formData.get("glazeId") as string | null) || null;
  const combinationId = (formData.get("combinationId") as string | null) || null;
  const combinationType = (formData.get("combinationType") as string | null) || null;
  const label = (formData.get("label") as string | null)?.trim() || null;
  const cone = (formData.get("cone") as string | null)?.trim() || null;
  const atmosphere = (formData.get("atmosphere") as string | null)?.trim() || null;

  if (!glazeId && !combinationId) return { error: "Select a glaze or combination first" };

  const sanitize = (n: string) => n.replace(/[^a-zA-Z0-9.-]/g, "-");
  const storagePath = `${viewer.profile.id}/${crypto.randomUUID()}-${sanitize(imageFile.name)}`;
  const buffer = new Uint8Array(await imageFile.arrayBuffer());

  const { error: uploadErr } = await supabase.storage
    .from("community-firing-images")
    .upload(storagePath, buffer, { contentType: imageFile.type, upsert: false });

  if (uploadErr) return { error: uploadErr.message };

  const { data: publicData } = supabase.storage.from("community-firing-images").getPublicUrl(storagePath);

  const { data: insertedImage, error: insertErr } = await supabase.from("community_firing_images").insert({
    glaze_id: glazeId || null,
    combination_id: combinationId || null,
    combination_type: combinationId ? combinationType : null,
    image_url: publicData.publicUrl,
    storage_path: storagePath,
    label,
    cone,
    atmosphere,
    uploader_user_id: viewer.profile.id,
  }).select("id").single();

  if (insertErr) return { error: insertErr.message };

  void awardPoints(
    viewer.profile.id,
    viewer.profile.isAdmin ?? false,
    "firing_photo_uploaded",
    2,
    insertedImage?.id,
    "community_image",
  );

  return { success: true };
}

export async function adminGetCombinationPreviewAction(id: string): Promise<{
  id: string;
  title: string;
  authorName: string;
  authorUserId: string;
  postFiringImageUrl: string;
  preFiringImageUrl: string | null;
  cone: string;
  atmosphere: string | null;
  glazingProcess: string | null;
  notes: string | null;
  kilnNotes: string | null;
  status: string;
  createdAt: string;
  layers: Array<{ id: string; glazeId: string; glazeName: string | null; glazeBrand: string | null; layerOrder: number }>;
} | null> {
  const viewer = await requireViewer();
  if (!viewer.profile.isAdmin) return null;

  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  type Row = Record<string, unknown>;
  const { data: row } = await admin
    .from("user_combination_examples")
    .select("*, user_combination_example_layers(*), profiles!author_user_id(display_name)")
    .eq("id", id)
    .single();

  if (!row) return null;
  const r = row as Row;
  const rawLayers = ((r.user_combination_example_layers ?? []) as Row[])
    .sort((a, b) => Number(a.layer_order) - Number(b.layer_order));

  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    authorName: r.profiles ? String((r.profiles as Row).display_name ?? "Unknown") : "Unknown",
    authorUserId: String(r.author_user_id),
    postFiringImageUrl: String(r.post_firing_image_path ?? ""),
    preFiringImageUrl: r.pre_firing_image_path ? String(r.pre_firing_image_path) : null,
    cone: String(r.cone ?? ""),
    atmosphere: r.atmosphere ? String(r.atmosphere) : null,
    glazingProcess: r.glazing_process ? String(r.glazing_process) : null,
    notes: r.notes ? String(r.notes) : null,
    kilnNotes: r.kiln_notes ? String(r.kiln_notes) : null,
    status: String(r.status ?? ""),
    createdAt: String(r.created_at),
    layers: rawLayers.map((layer) => {
      const glazeId = String(layer.glaze_id);
      const glaze = getCatalogGlazeById(glazeId);
      return {
        id: String(layer.id),
        glazeId,
        glazeName: glaze?.name ?? null,
        glazeBrand: glaze?.brand ?? null,
        layerOrder: Number(layer.layer_order),
      };
    }),
  };
}
