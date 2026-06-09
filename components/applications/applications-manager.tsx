"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Application, ApplicationStatus } from "@/types/application";
import PageHeader from "@/components/layout/page-header";
import EmptyState from "@/components/ui/empty-state";

const supabase = createClient();

type ApplicationForm = {
  company_name: string;
  role_title: string;
  location: string;
  status: ApplicationStatus;
  application_date: string;
  deadline: string;
  interview_date: string;
  prep_status: string;
  job_link: string;
  notes: string;
};

const EMPTY_FORM: ApplicationForm = {
  company_name: "",
  role_title: "",
  location: "",
  status: "Applied",
  application_date: "",
  deadline: "",
  interview_date: "",
  prep_status: "Not Started",
  job_link: "",
  notes: "",
};

const STATUS_OPTIONS: ApplicationStatus[] = [
  "Wishlist",
  "Applied",
  "OA",
  "Interview",
  "Offer",
  "Rejected",
];

const PREP_STATUS_OPTIONS = [
  "Not Started",
  "In Progress",
  "Ready",
  "Completed",
];

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function isOverdue(deadline: string | null, status: ApplicationStatus) {
  if (!deadline) return false;
  if (status === "Offer" || status === "Rejected") return false;
  return new Date(deadline).getTime() < Date.now();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ApplicationStatus>("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "deadline" | "company">(
    "newest"
  );

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

  const visibleItems = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    let result = [...items];

    if (search) {
      result = result.filter((item) =>
        [item.company_name, item.role_title, item.location ?? "", item.notes ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((item) => item.status === statusFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "company") {
        return a.company_name.localeCompare(b.company_name);
      }

      if (sortBy === "deadline") {
        const aDate = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        const bDate = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      }

      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [items, searchQuery, statusFilter, sortBy]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
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
      interview_date: item.interview_date ?? "",
      prep_status: item.prep_status ?? "Not Started",
      job_link: item.job_link ?? "",
      notes: item.notes ?? "",
    });
    setError("");
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
      interview_date: form.interview_date || null,
      prep_status: form.prep_status,
      job_link: form.job_link.trim() || null,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    let responseError: { message: string } | null = null;

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
      <PageHeader
        title="Applications"
        description="Add, edit, and manage every internship and job application in one place."
        actions={
          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            New Application
          </button>
        }
      />

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <InputField
          label="Search"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search company, role, notes..."
        />
        <SelectField
          label="Status"
          value={statusFilter}
          options={["All", "Wishlist", "Applied", "OA", "Interview", "Offer", "Rejected"]}
          onChange={(value) => setStatusFilter(value as "All" | ApplicationStatus)}
        />
        <SelectField
          label="Sort by"
          value={sortBy}
          options={["newest", "oldest", "deadline", "company"]}
          onChange={(value) =>
            setSortBy(value as "newest" | "oldest" | "deadline" | "company")
          }
        />
        <button
          type="button"
          onClick={() => {
            setSearchQuery("");
            setStatusFilter("All");
            setSortBy("newest");
          }}
          className="mt-7 h-[48px] rounded-xl border px-4 py-3 text-sm font-medium hover:bg-muted"
        >
          Clear Filters
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
            onChange={(value) =>
              setForm((prev) => ({ ...prev, location: value }))
            }
            placeholder="Remote"
          />

          <SelectField
            label="Prep Status"
            value={form.prep_status}
            options={PREP_STATUS_OPTIONS}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, prep_status: value }))
            }
          />

          <InputField
            label="Interview Date"
            type="date"
            value={form.interview_date}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, interview_date: value }))
            }
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
            onChange={(value) =>
              setForm((prev) => ({ ...prev, deadline: value }))
            }
          />

          <InputField
            label="Job Link"
            value={form.job_link}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, job_link: value }))
            }
            placeholder="https://..."
          />

          <div className="md:col-span-2">
            <TextAreaField
              label="Notes"
              value={form.notes}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, notes: value }))
              }
              placeholder="Application notes, interview prep, referral info..."
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

        {visibleItems.length === 0 ? (
          <EmptyState
            title="No applications found"
            description="Try another search term or clear the filters."
          />
        ) : (
          <div className="grid gap-4">
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => router.push(`/applications/${item.id}`)}
                        className="text-lg font-semibold hover:underline"
                      >
                        {item.company_name}
                      </button>

                      <span className="rounded-full border px-3 py-1 text-xs">
                        {item.status}
                      </span>

                      {isOverdue(item.deadline, item.status) && (
                        <span className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-600">
                          Overdue
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.role_title}
                      {item.location ? ` • ${item.location}` : ""}
                    </p>

                    <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                      <p>Applied on: {formatDate(item.application_date)}</p>
                      <p>Deadline: {formatDate(item.deadline)}</p>
                      <p>Interview date: {formatDate(item.interview_date ?? null)}</p>
                      <p>Prep status: {item.prep_status || "Not Started"}</p>
                    </div>

                    {item.notes && <p className="mt-3 text-sm">{item.notes}</p>}
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