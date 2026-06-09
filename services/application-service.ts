import { supabaseAdmin } from "@/lib/supabase/admin";

export async function fetchApplications(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}