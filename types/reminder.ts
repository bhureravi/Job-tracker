export interface Reminder {
  id: string;
  user_id: string;
  application_id: string | null;
  reminder_type: string;
  reminder_time: string;
  channel: "in_app" | "whatsapp" | "email";
  is_done: boolean;
  created_at: string;
}