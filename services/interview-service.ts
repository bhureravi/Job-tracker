import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Interview } from "@/types/interview";

export async function fetchInterviewsByApplication(applicationId: string) {
  const { data, error } = await supabaseAdmin
    .from("interviews")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Interview[]) ?? [];
}

export async function createInterview(interview: Omit<Interview, "id" | "created_at">) {
  const { error } = await supabaseAdmin.from("interviews").insert(interview);
  if (error) throw error;
}

export async function updateInterview(
  id: string,
  updates: Partial<Omit<Interview, "id" | "created_at" | "application_id" | "user_id">>
) {
  const { error } = await supabaseAdmin
    .from("interviews")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteInterview(id: string) {
  const { error } = await supabaseAdmin.from("interviews").delete().eq("id", id);
  if (error) throw error;
}