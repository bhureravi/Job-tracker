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
  company_website?: string | null;
  referral_name?: string | null;
  interview_date?: string | null;
  next_follow_up_date?: string | null;
  prep_status?: string | null;
  created_at: string;
  updated_at?: string;
}