export interface Interview {
  id: string;
  application_id: string;
  user_id: string;
  round_name: string;
  interview_date: string | null;
  notes: string | null;
  outcome: string | null;
  questions_asked: string | null;
  prep_notes: string | null;
  interviewer_name: string | null;
  interview_link: string | null;
  round_status: "Upcoming" | "Done" | "Missed" | "Cancelled";
  created_at: string;
}