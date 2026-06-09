"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Application } from "@/types/application";
import type { Reminder } from "@/types/reminder";
import type { Profile } from "@/types/profile";
import PageHeader from "@/components/layout/page-header";
import EmptyState from "@/components/ui/empty-state";

const supabase = createClient();

type ReminderWithApp = Reminder & {
  applications?: {
    company_name: string;
    role_title: string;
  } | null;
};

type ReminderForm = {
  application_id: string;
  title: string;
  message: string;
  reminder_type: string;
  channel: "in_app" | "whatsapp" | "email";
  reminder_time: string;
};

const EMPTY_FORM: ReminderForm = {
  application_id: "",
  title: "",
  message: "",
  reminder_type: "deadline",
  channel: "in_app",
  reminder_time: "",
};

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function RemindersManager() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reminders, setReminders] = useState<ReminderWithApp[]>([]);
  const [form, setForm] = useState<ReminderForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // const [testStatus, setTestStatus] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadData = async (uid: string) => {
    const [appsRes, remindersRes, profileRes] = await Promise.all([
      supabase
        .from("applications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      supabase
        .from("reminders")
        .select("*, applications(company_name, role_title)")
        .eq("user_id", uid)
        .order("reminder_time", { ascending: true }),
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    ]);

    if (appsRes.error) {
      setError(appsRes.error.message);
      return;
    }

    if (remindersRes.error) {
      setError(remindersRes.error.message);
      return;
    }

    if (profileRes.error) {
      setError(profileRes.error.message);
      return;
    }

    setApplications((appsRes.data as Application[]) ?? []);
    setReminders((remindersRes.data as ReminderWithApp[]) ?? []);
    setProfile((profileRes.data as Profile) ?? null);
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
      await loadData(user.id);
      setLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (profile?.notification_channel) {
      setForm((prev) => ({
        ...prev,
        channel: profile.notification_channel,
      }));
    }
  }, [profile]);

  const stats = useMemo(() => {
    const total = reminders.length;
    const whatsapp = reminders.filter((r) => r.channel === "whatsapp").length;
    const pending = reminders.filter((r) => !r.is_sent).length;
    const sent = reminders.filter((r) => r.is_sent).length;

    return { total, whatsapp, pending, sent };
  }, [reminders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError("");

    const payload = {
      user_id: userId,
      application_id: form.application_id || null,
      title: form.title.trim(),
      message: form.message.trim() || null,
      reminder_type: form.reminder_type,
      reminder_time: new Date(form.reminder_time).toISOString(),
      channel: form.channel,
      is_sent: false,
      sent_at: null,
      delivery_status: "pending",
      attempt_count: 0,
      last_error: null,
    };

    const { error } = await supabase.from("reminders").insert(payload);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    await loadData(userId);
    setForm((prev) => ({
      ...EMPTY_FORM,
      channel: prev.channel,
    }));
    setSaving(false);
  };

  const markDone = async (id: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from("reminders")
      .update({
        is_sent: true,
        sent_at: new Date().toISOString(),
        delivery_status: "sent",
        last_error: null,
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setError(error.message);
      return;
    }

    await loadData(userId);
  };

  const removeReminder = async (id: string) => {
    if (!userId) return;

    const ok = confirm("Delete this reminder?");
    if (!ok) return;

    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setError(error.message);
      return;
    }

    await loadData(userId);
  };

  // const sendWhatsAppTest = async () => {
  //   setTestStatus("Sending test message...");
  //   const res = await fetch("/api/whatsapp/test", {
  //     method: "POST",
  //   });

  //   const data = await res.json();
  //   setTestStatus(data.message ?? "Test sent");
  // };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-muted-foreground">Loading reminders...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
  title="Reminders"
  description="Create deadline, follow-up, and WhatsApp reminders for your applications."
/>

<div className="mt-4 rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
  WhatsApp reminders are delivered automatically when the reminder time is reached and your Twilio configuration is active.
</div>

      {/* {testStatus && (
        <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm">{testStatus}</p>
      )} */}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Sent" value={stats.sent} />
        <StatCard label="WhatsApp" value={stats.whatsapp} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-2xl border bg-card p-6 shadow-sm"
      >
        <h2 className="text-xl font-semibold">Create Reminder</h2>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <SelectField
            label="Application"
            value={form.application_id}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, application_id: value }))
            }
            options={[
              { label: "Select application", value: "" },
              ...applications.map((app) => ({
                label: `${app.company_name} — ${app.role_title}`,
                value: app.id,
              })),
            ]}
          />

          <InputField
            label="Title"
            value={form.title}
            onChange={(value) => setForm((prev) => ({ ...prev, title: value }))}
            placeholder="Interview follow-up"
          />

          <InputField
            label="Reminder Time"
            type="datetime-local"
            value={form.reminder_time}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, reminder_time: value }))
            }
          />

          <SelectField
            label="Channel"
            value={form.channel}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                channel: value as ReminderForm["channel"],
              }))
            }
            options={[
              { label: "In-app", value: "in_app" },
              { label: "WhatsApp", value: "whatsapp" },
              { label: "Email", value: "email" },
            ]}
          />

          <InputField
            label="Reminder Type"
            value={form.reminder_type}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, reminder_type: value }))
            }
            placeholder="deadline / follow_up / interview"
          />

          <div className="md:col-span-2">
            <TextAreaField
              label="Message"
              value={form.message}
              onChange={(value) => setForm((prev) => ({ ...prev, message: value }))}
              placeholder="Reminder message that will be shown or sent on WhatsApp"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 rounded-xl bg-black px-5 py-3 text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add Reminder"}
        </button>
      </form>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Saved Reminders</h2>

        {reminders.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No reminders yet"
              description="Create your first reminder for a deadline, interview, or follow-up."
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            {reminders.map((reminder) => (
              <article
                key={reminder.id}
                className="rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold">{reminder.title}</h3>
                      <span className="rounded-full border px-3 py-1 text-xs">
                        {reminder.channel}
                      </span>
                      <span className="rounded-full border px-3 py-1 text-xs">
                        {reminder.is_sent ? "Done" : "Pending"}
                      </span>
                      <span className="rounded-full border px-3 py-1 text-xs">
                        {reminder.delivery_status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {reminder.applications
                        ? `${reminder.applications.company_name} — ${reminder.applications.role_title}`
                        : "No linked application"}
                    </p>

                    <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                      <p>Type: {reminder.reminder_type}</p>
                      <p>Time: {formatDateTime(reminder.reminder_time)}</p>
                      <p>Sent at: {formatDateTime(reminder.sent_at)}</p>
                      <p>Attempts: {reminder.attempt_count}</p>
                      {reminder.last_error && (
                        <p className="text-red-600">
                          Last error: {reminder.last_error}
                        </p>
                      )}
                    </div>

                    {reminder.message && (
                      <p className="mt-3 text-sm">{reminder.message}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => markDone(reminder.id)}
                      className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
                    >
                      Mark Done
                    </button>
                    <button
                      type="button"
                      onClick={() => removeReminder(reminder.id)}
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
  options: Array<{ label: string; value: string }>;
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
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}