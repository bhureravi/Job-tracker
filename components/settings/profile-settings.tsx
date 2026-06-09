"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/profile";
import PageHeader from "@/components/layout/page-header";

const supabase = createClient();

type ProfileForm = {
  full_name: string;
  email: string;
  core_skills: string;
  target_roles: string;
  summary: string;
  phone_number: string;
  notification_channel: "in_app" | "whatsapp";
  notifications_enabled: boolean;
};
const EMPTY_FORM: ProfileForm = {
  full_name: "",
  email: "",
  core_skills: "",
  target_roles: "",
  summary: "",
  phone_number: "",
  notification_channel: "in_app",
  notifications_enabled: true,
};

export default function ProfileSettings() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const skillPreview = useMemo(() => {
    return form.core_skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }, [form.core_skills]);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/sign-in");
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const profile = data as Profile;

    setForm({
  full_name: profile.full_name ?? "",
  email: profile.email ?? user.email ?? "",
  core_skills: profile.core_skills ?? "",
  target_roles: profile.target_roles ?? "",
  summary: profile.summary ?? "",
  phone_number: profile.phone_number ?? "",
  notification_channel: profile.notification_channel ?? "in_app",
  notifications_enabled: profile.notifications_enabled ?? true,
});

    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) return;

    setSaving(true);
    setError("");
    setMessage("");

    const { error } = await supabase.from("profiles").upsert({
  id: userId,
  full_name: form.full_name.trim(),
  email: form.email.trim(),
  core_skills: form.core_skills.trim() || null,
  target_roles: form.target_roles.trim() || null,
  summary: form.summary.trim() || null,
  phone_number: form.phone_number.trim() || null,
  notification_channel: form.notification_channel,
  notifications_enabled: form.notifications_enabled,
});

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setMessage("Profile saved successfully.");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <form
          onSubmit={handleSave}
          
          className="rounded-2xl border bg-card p-6 shadow-sm"
        >
          <PageHeader
            title="Settings"
            description="Save your skills, target roles, and reminder preferences."
          />

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </p>
          )}

          <div className="mt-6 grid gap-4">
            <InputField
              label="Full Name"
              value={form.full_name}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, full_name: value }))
              }
              placeholder="Your name"
            />
            <InputField
              label="Email"
              value={form.email}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, email: value }))
              }
              placeholder="you@example.com"
            />
            <TextAreaField
              label="Core Skills"
              value={form.core_skills}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, core_skills: value }))
              }
              placeholder="React, Next.js, TypeScript, Node.js, Supabase, SQL"
              helper="Use commas. These are the skills the ATS analyzer will compare against the JD."
            />
            <TextAreaField
              label="Target Roles"
              value={form.target_roles}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, target_roles: value }))
              }
              placeholder="Frontend Intern, Full Stack Intern, Software Engineer Intern"
            />
            <TextAreaField
              label="Short Summary"
              value={form.summary}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, summary: value }))
              }
              placeholder="One short paragraph about your profile"
            />

            <SelectField
              label="Default Notification Channel"
              value={form.notification_channel}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  notification_channel: value as "in_app" | "whatsapp",
                }))
              }
              options={["in_app", "whatsapp"]}
            />

            {/* <InputField
              label="Reminder Lead Days"
              // value={form.reminder_lead_days}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, reminder_lead_days: value }))
              }
              placeholder="2"
              type="number"
            /> */}
            <InputField
  label="WhatsApp Phone Number"
  value={form.phone_number}
  onChange={(value) => setForm((prev) => ({ ...prev, phone_number: value }))}
  placeholder="+91XXXXXXXXXX"
/>

            <label className="flex items-center gap-3 rounded-xl border px-4 py-3">
              <input
                type="checkbox"
                checked={form.notifications_enabled}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    notifications_enabled: e.target.checked,
                  }))
                }
              />
              <span className="text-sm font-medium">Enable notifications</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 rounded-xl bg-black px-5 py-3 text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <aside className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">ATS profile preview</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            These skills are used to calculate your match score.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {skillPreview.length === 0 ? (
              <span className="rounded-full border px-3 py-1 text-sm text-muted-foreground">
                No skills added yet
              </span>
            ) : (
              skillPreview.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border px-3 py-1 text-sm"
                >
                  {skill}
                </span>
              ))
            )}
          </div>

          <div className="mt-6 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Reminder preferences</p>
           <p className="mt-1">Channel: {form.notification_channel}</p>
<p>
  WhatsApp: {form.phone_number || "Not configured"}
</p>
<p>
  Notifications: {form.notifications_enabled ? "On" : "Off"}
</p>
          </div>

          <div className="mt-6 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            Strong profiles work best when skills are comma-separated and specific.
          </div>
        </aside>
      </div>
    </main>
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
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-xl border px-4 py-3 outline-none"
      />
      {helper && <p className="mt-2 text-xs text-muted-foreground">{helper}</p>}
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