"use server";

import { redirect } from "next/navigation";
import { revalidateWorkspace, requireMemberSupabase } from "./_shared";

export async function deleteUserCombinationAction(formData: FormData) {
  const { viewer, supabase } = await requireMemberSupabase("/combinations");
  const exampleId = formData.get("exampleId")?.toString();

  if (!exampleId) {
    redirect("/combinations?error=Missing%20example%20id");
  }

  // Verify ownership (RLS enforces this too, but be explicit)
  const { data: example } = await supabase
    .from("user_combination_examples")
    .select("id, author_user_id, image_paths")
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

