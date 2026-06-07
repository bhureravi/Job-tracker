"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Application, ApplicationStatus } from "@/types/application";

type ApplicationForm = {
  company_name: string;
  role_title: string;
  location: string;
  status: ApplicationStatus;
  application_date: string;
  deadline: string;
  job_link: string;
  notes: string;
  resume_version: string;
  jd_text: string;
  follow_up_date: string;
};

const EMPTY_FORM: ApplicationForm = {
  company_name: "",
  role_title: "",
  location: "",
  status: "Applied",
  application_date: "",
  deadline: "",
  job_link: "",
  notes: "",
  resume_version: "",
  jd_text: "",
  follow_up_date: "",
};

const STATUS_OPTIONS: ApplicationStatus[] = [
  "Wishlist",
  "Applied",
  "OA",
  "Interview",
  "Offer",
  "Rejected",
];

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function ApplicationsManager() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<Application[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<ApplicationForm>(EMPTY_FORM);

  const loadApplications = async (uid: string) => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setItems((data as Application[]) ?? []);
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      setUserId(user.id);
      await loadApplications(user.id);
      setLoading(false);
    };

    init();
  }, [router]);

  const stats = useMemo(() => {
    const total = items.length;
    const applied = items.filter((item) => item.status === "Applied").length;
    const interviews = items.filter((item) => item.status === "Interview").length;
    const offers = items.filter((item) => item.status === "Offer").length;

    return { total, applied, interviews, offers };
  }, [items]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleEdit = (item: Application) => {
    setEditingId(item.id);
    setForm({
      company_name: item.company_name ?? "",
      role_title: item.role_title ?? "",
      location: item.location ?? "",
      status: item.status,
      application_date: item.application_date ?? "",
      deadline: item.deadline ?? "",
      job_link: item.job_link ?? "",
      notes: item.notes ?? "",
      resume_version: item.resume_version ?? "",
      jd_text: item.jd_text ?? "",
      follow_up_date: item.follow_up_date ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;

    const ok = confirm("Delete this application?");
    if (!ok) return;

    setError("");
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setError(error.message);
      return;
    }

    await loadApplications(userId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError("");

    const payload = {
      user_id: userId,
      company_name: form.company_name.trim(),
      role_title: form.role_title.trim(),
      location: form.location.trim() || null,
      status: form.status,
      application_date: form.application_date || null,
      deadline: form.deadline || null,
      job_link: form.job_link.trim() || null,
      notes: form.notes.trim() || null,
      resume_version: form.resume_version.trim() || null,
      jd_text: form.jd_text.trim() || null,
      follow_up_date: form.follow_up_date || null,
      updated_at: new Date().toISOString(),
    };

    let responseError = null;

    if (editingId) {
      const { error } = await supabase
        .from("applications")
        .update(payload)
        .eq("id", editingId)
        .eq("user_id", userId);

      responseError = error;
    } else {
      const { error } = await supabase.from("applications").insert(payload);
      responseError = error;
    }

    if (responseError) {
      setError(responseError.message);
      setSaving(false);
      return;
    }

    await loadApplications(userId);
    resetForm();
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-muted-foreground">Loading applications...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="mt-2 text-muted-foreground">
            Add, edit, and manage every internship/job application in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={resetForm}
          className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          New Application
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Applied" value={stats.applied} />
        <StatCard label="Interviews" value={stats.interviews} />
        <StatCard label="Offers" value={stats.offers} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-2xl border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            {editingId ? "Edit Application" : "Add Application"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm underline"
            >
              Cancel edit
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InputField
            label="Company Name"
            value={form.company_name}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, company_name: value }))
            }
            placeholder="Google"
          />
          <InputField
            label="Role Title"
            value={form.role_title}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, role_title: value }))
            }
            placeholder="Software Engineering Intern"
          />
          <InputField
            label="Location"
            value={form.location}
            onChange={(value) => setForm((prev) => ({ ...prev, location: value }))}
            placeholder="Remote"
          />
          <SelectField
            label="Status"
            value={form.status}
            options={STATUS_OPTIONS}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, status: value as ApplicationStatus }))
            }
          />
          <InputField
            label="Application Date"
            type="date"
            value={form.application_date}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, application_date: value }))
            }
          />
          <InputField
            label="Deadline"
            type="date"
            value={form.deadline}
            onChange={(value) => setForm((prev) => ({ ...prev, deadline: value }))}
          />
          <InputField
            label="Job Link"
            value={form.job_link}
            onChange={(value) => setForm((prev) => ({ ...prev, job_link: value }))}
            placeholder="https://..."
          />
          <InputField
            label="Resume Version"
            value={form.resume_version}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, resume_version: value }))
            }
            placeholder="resume_v3.pdf"
          />
          <InputField
            label="Follow-up Date"
            type="date"
            value={form.follow_up_date}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, follow_up_date: value }))
            }
          />
          <div className="md:col-span-2">
            <TextAreaField
              label="Notes"
              value={form.notes}
              onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))}
              placeholder="Referral info, interview prep notes, application status..."
            />
          </div>
          <div className="md:col-span-2">
            <TextAreaField
              label="Job Description / Keywords"
              value={form.jd_text}
              onChange={(value) => setForm((prev) => ({ ...prev, jd_text: value }))}
              placeholder="Paste the JD here if you want to analyze it later..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 rounded-xl bg-black px-5 py-3 text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : editingId ? "Update Application" : "Add Application"}
        </button>
      </form>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Saved Applications</h2>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border p-8 text-center text-muted-foreground">
            No applications yet. Add your first one above.
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {item.company_name}
                      </h3>
                      <span className="rounded-full border px-3 py-1 text-xs">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.role_title} {item.location ? `• ${item.location}` : ""}
                    </p>

                    <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                      <p>Applied on: {formatDate(item.application_date)}</p>
                      <p>Deadline: {formatDate(item.deadline)}</p>
                      <p>Follow-up: {formatDate(item.follow_up_date)}</p>
                      <p>Resume: {item.resume_version || "-"}</p>
                    </div>

                    {item.notes && (
                      <p className="mt-3 text-sm">{item.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-xl border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
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