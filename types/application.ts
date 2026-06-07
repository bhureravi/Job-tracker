export type ApplicationStatus =
  | "Wishlist"
  | "Applied"
  | "OA"
  | "Interview"
  | "Offer"
  | "Rejected";

export interface Application {
  id: string;
  user_id: string;
  company_name: string;
  role_title: string;
  location: string | null;
  status: ApplicationStatus;
  application_date: string | null;
  deadline: string | null;
  job_link: string | null;
  notes: string | null;
  resume_version: string | null;
  jd_text: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at?: string;
}