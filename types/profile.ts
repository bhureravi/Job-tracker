export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  core_skills: string | null;
  target_roles: string | null;
  summary: string | null;
  phone_number: string | null;
  notification_channel: "in_app" | "whatsapp";
  notifications_enabled: boolean;
  created_at: string;
}