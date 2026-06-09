export interface Reminder {
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
  created_at: string;
}