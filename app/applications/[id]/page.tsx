"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Application } from "@/types/application";
import type { Interview } from "@/types/interview";
import ATSAnalyzer from "@/components/applications/ats-analyzer";
import TagManager from "@/components/applications/tag-manager";

const supabase = createClient();

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

type InterviewForm = {
  round_name: string;
  interview_date: string;
  notes: string;
  outcome: string;
  questions_asked: string;
  prep_notes: string;
  interviewer_name: string;
  interview_link: string;
  round_status: "Upcoming" | "Done" | "Missed" | "Cancelled";
};

const EMPTY_INTERVIEW: InterviewForm = {
  round_name: "",
  interview_date: "",
  notes: "",
  outcome: "",
  questions_asked: "",
  prep_notes: "",
  interviewer_name: "",
  interview_link: "",
  round_status: "Upcoming",
};

export default function ApplicationDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [item, setItem] = useState<Application | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [saving, setSaving] = useState(false);
  const [interviewForm, setInterviewForm] = useState<InterviewForm>(EMPTY_INTERVIEW);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/sign-in");
      return;
    }

    const appRes = await supabase
      .from("applications")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (appRes.error) {
      setError(appRes.error.message);
      setLoading(false);
      return;
    }

    const interviewRes = await supabase
      .from("interviews")
      .select("*")
      .eq("application_id", params.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (interviewRes.error) {
      setError(interviewRes.error.message);
      setLoading(false);
      return;
    }

    setItem(appRes.data as Application);
    setInterviews((interviewRes.data as Interview[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const hasInterview = useMemo(() => interviews.length > 0, [interviews]);

  const handleAddInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/sign-in");
      return;
    }

    const { error } = await supabase.from("interviews").insert({
      application_id: item.id,
      user_id: user.id,
      round_name: interviewForm.round_name.trim(),
      interview_date: interviewForm.interview_date || null,
      notes: interviewForm.notes.trim() || null,
      outcome: interviewForm.outcome.trim() || null,
      questions_asked: interviewForm.questions_asked.trim() || null,
      prep_notes: interviewForm.prep_notes.trim() || null,
      interviewer_name: interviewForm.interviewer_name.trim() || null,
      interview_link: interviewForm.interview_link.trim() || null,
      round_status: interviewForm.round_status,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    await loadData();
    setInterviewForm(EMPTY_INTERVIEW);
    setSaving(false);
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-muted-foreground">Loading application...</p>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Application not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <h1 className="text-3xl font-bold">{item.company_name}</h1>
            <p className="mt-2 text-muted-foreground">{item.role_title}</p>
          </div>
          <span className="w-fit rounded-full border px-3 py-1 text-sm">
            {item.status}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoBox label="Location" value={item.location ?? "-"} />
          <InfoBox label="Application Date" value={formatDate(item.application_date)} />
          <InfoBox label="Deadline" value={formatDate(item.deadline)} />
          <InfoBox label="Follow-up Date" value={formatDate(item.follow_up_date)} />
          <InfoBox label="Resume Version" value={item.resume_version ?? "-"} />
          <InfoBox label="Prep Status" value={item.prep_status ?? "Not Started"} />
          <InfoBox label="Company Website" value={item.company_website ?? "-"} />
          <InfoBox label="Referral Name" value={item.referral_name ?? "-"} />
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Notes</h2>
          <p className="mt-3 whitespace-pre-wrap rounded-xl border p-4 text-sm">
            {item.notes || "No notes added yet."}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Job Description / Keywords</h2>
          <p className="mt-3 whitespace-pre-wrap rounded-xl border p-4 text-sm">
            {item.jd_text || "No JD text saved yet."}
          </p>
        </section>
        <ATSAnalyzer jdText={item.jd_text} />
        <TagManager applicationId={item.id} />

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Interview Rounds</h2>

          <form
            onSubmit={handleAddInterview}
            className="mt-4 rounded-2xl border p-5"
          >
            <h3 className="font-semibold">Add Interview Round</h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <InputField
                label="Round Name"
                value={interviewForm.round_name}
                onChange={(value) =>
                  setInterviewForm((prev) => ({ ...prev, round_name: value }))
                }
                placeholder="OA / HR / Technical"
              />
              <InputField
                label="Interview Date"
                type="date"
                value={interviewForm.interview_date}
                onChange={(value) =>
                  setInterviewForm((prev) => ({ ...prev, interview_date: value }))
                }
              />
              <InputField
                label="Interviewer Name"
                value={interviewForm.interviewer_name}
                onChange={(value) =>
                  setInterviewForm((prev) => ({ ...prev, interviewer_name: value }))
                }
                placeholder="John Doe"
              />
              <SelectField
                label="Round Status"
                value={interviewForm.round_status}
                onChange={(value) =>
                  setInterviewForm((prev) => ({
                    ...prev,
                    round_status: value as InterviewForm["round_status"],
                  }))
                }
                options={["Upcoming", "Done", "Missed", "Cancelled"]}
              />
              <div className="md:col-span-2">
                <TextAreaField
                  label="Questions Asked"
                  value={interviewForm.questions_asked}
                  onChange={(value) =>
                    setInterviewForm((prev) => ({ ...prev, questions_asked: value }))
                  }
                  placeholder="List the questions asked in the interview"
                />
              </div>
              <div className="md:col-span-2">
                <TextAreaField
                  label="Prep Notes"
                  value={interviewForm.prep_notes}
                  onChange={(value) =>
                    setInterviewForm((prev) => ({ ...prev, prep_notes: value }))
                  }
                  placeholder="What you studied, what to revise, weak areas..."
                />
              </div>
              <div className="md:col-span-2">
                <TextAreaField
                  label="General Notes"
                  value={interviewForm.notes}
                  onChange={(value) =>
                    setInterviewForm((prev) => ({ ...prev, notes: value }))
                  }
                  placeholder="Any extra notes about this round"
                />
              </div>
              <div className="md:col-span-2">
                <InputField
                  label="Interview Link"
                  value={interviewForm.interview_link}
                  onChange={(value) =>
                    setInterviewForm((prev) => ({ ...prev, interview_link: value }))
                  }
                  placeholder="Google Meet / Zoom / Teams link"
                />
              </div>
              <div className="md:col-span-2">
                <InputField
                  label="Outcome"
                  value={interviewForm.outcome}
                  onChange={(value) =>
                    setInterviewForm((prev) => ({ ...prev, outcome: value }))
                  }
                  placeholder="Selected / Rejected / Waiting"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 rounded-xl bg-black px-5 py-3 text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Interview Round"}
            </button>
          </form>

          {hasInterview ? (
            <div className="mt-5 grid gap-4">
              {interviews.map((interview) => (
                <article
                  key={interview.id}
                  className="rounded-2xl border bg-card p-5 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{interview.round_name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Date: {formatDate(interview.interview_date)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {interview.round_status}
                      </p>
                    </div>
                    <span className="rounded-full border px-3 py-1 text-sm">
                      {interview.outcome || "No outcome"}
                    </span>
                  </div>

                  {interview.prep_notes && (
                    <p className="mt-3 text-sm">
                      <span className="font-semibold">Prep Notes:</span>{" "}
                      {interview.prep_notes}
                    </p>
                  )}

                  {interview.questions_asked && (
                    <p className="mt-3 text-sm">
                      <span className="font-semibold">Questions Asked:</span>{" "}
                      {interview.questions_asked}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              No interview rounds added yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium break-words">{value}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-4 py-3 outline-none"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full rounded-xl border px-4 py-3 outline-none"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-4 py-3 outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}