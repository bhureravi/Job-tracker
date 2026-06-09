import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/twilio";

export type ReminderRow = {
  id: string;
  user_id: string;
  application_id: string | null;
  title: string;
  message: string | null;
  reminder_type: string;
  reminder_time: string;
  channel: "in_app" | "whatsapp" | "email";
  is_sent: boolean;
  sent_at: string | null;
  delivery_status: "pending" | "sent" | "failed";
  attempt_count: number;
  last_error: string | null;
  applications?: {
    company_name: string;
    role_title: string;
  } | null;
};

async function getUserPhoneNumber(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("phone_number, notifications_enabled")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return {
    phoneNumber: data?.phone_number ?? null,
    notificationsEnabled: data?.notifications_enabled ?? true,
  };
}

export async function fetchDueReminders() {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("reminders")
    .select("*, applications(company_name, role_title)")
    .lte("reminder_time", nowIso)
    .eq("delivery_status", "pending")
    .order("reminder_time", { ascending: true });

  if (error) throw error;

  return (data as ReminderRow[]) ?? [];
}

export async function markReminderSent(reminderId: string) {
  const { error } = await supabaseAdmin
    .from("reminders")
    .update({
      is_sent: true,
      sent_at: new Date().toISOString(),
      delivery_status: "sent",
      last_error: null,
    })
    .eq("id", reminderId);

  if (error) throw error;
}

export async function markReminderFailed(reminderId: string, message: string) {
  const { error } = await supabaseAdmin
    .from("reminders")
    .update({
      delivery_status: "failed",
      last_error: message,
      attempt_count: 1,
    })
    .eq("id", reminderId);

  if (error) throw error;
}

export async function processDueReminders() {
  const reminders = await fetchDueReminders();

  let whatsappSent = 0;
  let markedDone = 0;
  let failed = 0;

  for (const reminder of reminders) {
    const text =
      reminder.message ||
      `${reminder.title} for ${reminder.applications?.company_name ?? "your application"}`;

    try {
      if (reminder.channel === "whatsapp") {
        const { phoneNumber, notificationsEnabled } = await getUserPhoneNumber(
          reminder.user_id
        );

        if (!notificationsEnabled) {
          await markReminderSent(reminder.id);
          markedDone += 1;
          continue;
        }

        if (!phoneNumber) {
          throw new Error("Missing WhatsApp phone number in Settings");
        }

        await sendWhatsAppMessage(`whatsapp:${phoneNumber}`, text);
        whatsappSent += 1;
      }

      await markReminderSent(reminder.id);
      markedDone += 1;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown reminder delivery error";

      await markReminderFailed(reminder.id, message);
      failed += 1;
    }
  }

  return {
    scanned: reminders.length,
    whatsappSent,
    markedDone,
    failed,
  };
}