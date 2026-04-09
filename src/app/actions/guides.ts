"use server";

import { z } from "zod";

import { getViewer } from "@/lib/data/users";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const guideErrorReportSchema = z.object({
  guideSlug: z.string().trim().min(1).max(80),
  guideTitle: z.string().trim().min(1).max(200),
  sectionId: z.string().trim().min(1).max(120),
  sectionLabel: z.string().trim().min(1).max(200),
  note: z.string().trim().min(8).max(1000),
  pagePath: z.string().trim().startsWith("/guides/glazing-pottery/").max(200),
});

export type GuideErrorReportState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function submitGuideErrorReportAction(
  _previousState: GuideErrorReportState,
  formData: FormData,
): Promise<GuideErrorReportState> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Guide reports are not available right now.",
    };
  }

  const parsed = guideErrorReportSchema.safeParse({
    guideSlug: formData.get("guideSlug"),
    guideTitle: formData.get("guideTitle"),
    sectionId: formData.get("sectionId"),
    sectionLabel: formData.get("sectionLabel"),
    note: formData.get("note"),
    pagePath: formData.get("pagePath"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the section and note.",
    };
  }

  const viewer = await getViewer();
  const userId =
    viewer?.mode === "live" && !viewer.profile.isAnonymous ? viewer.profile.id : null;

  const { error } = await supabase.from("analytics_events").insert({
    event_type: "guide_error_report",
    user_id: userId,
    glaze_id: null,
    metadata: {
      guide_slug: parsed.data.guideSlug,
      guide_title: parsed.data.guideTitle,
      section_id: parsed.data.sectionId,
      section_label: parsed.data.sectionLabel,
      note: parsed.data.note,
      page_path: parsed.data.pagePath,
    },
  });

  if (error) {
    return {
      status: "error",
      message: "Could not send the report. Please try again.",
    };
  }

  return {
    status: "success",
    message: "Thanks — the guide report has been sent to the admins.",
  };
}
