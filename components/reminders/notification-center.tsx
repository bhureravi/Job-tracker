"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Reminder } from "@/types/reminder";

const supabase = createClient();

type ReminderWithApp = Reminder & {
  applications?: {
    company_name: string;
    role_title: string;
  } | null;
};

function timeLeftLabel(value: string) {
  const diff = new Date(value).getTime() - Date.now();
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 0) return `${Math.abs(hours)}h overdue`;
  if (hours === 0) return "due now";
  if (hours === 1) return "in 1 hour";
  return `in ${hours} hours`;
}

export default function NotificationCenter() {
  const router = useRouter();
  const [reminders, setReminders] = useState<ReminderWithApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/sign-in");
      return;
    }

    const { data, error } = await supabase
      .from("reminders")
      .select("*, applications(company_name, role_title)")
      .eq("user_id", user.id)
      .order("reminder_time", { ascending: true });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setReminders((data as ReminderWithApp[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = Date.now();

  const overdue = useMemo(
    () =>
      reminders.filter(
        (r) => !r.is_sent && new Date(r.reminder_time).getTime() < now
      ),
    [reminders, now]
  );

  const dueSoon = useMemo(
    () =>
      reminders.filter((r) => {
        const diff = new Date(r.reminder_time).getTime() - now;
        return !r.is_sent && diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7;
      }),
    [reminders, now]
  );

  const whatsappPending = useMemo(
    () => reminders.filter((r) => !r.is_sent && r.channel === "whatsapp"),
    [reminders]
  );

  if (loading) {
    return (
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading notification center...</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold">Notification Center</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Focus on urgent reminders first.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/reminders")}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
        >
          Open Reminders
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Overdue" value={overdue.length} />
        <StatCard label="Due Soon" value={dueSoon.length} />
        <StatCard label="WhatsApp Pending" value={whatsappPending.length} />
      </div>

      <div className="mt-6 grid gap-4">
        {dueSoon.length === 0 ? (
          <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
            No urgent reminders due in the next 7 days.
          </div>
        ) : (
          dueSoon.slice(0, 5).map((reminder) => (
            <article
              key={reminder.id}
              className="rounded-xl border p-4"
            >
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                <div>
                  <h3 className="font-semibold">{reminder.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {reminder.applications
                      ? `${reminder.applications.company_name} — ${reminder.applications.role_title}`
                      : "No linked application"}
                  </p>
                </div>
                <span className="rounded-full border px-3 py-1 text-xs">
                  {timeLeftLabel(reminder.reminder_time)}
                </span>
              </div>

              {reminder.message && (
                <p className="mt-3 text-sm">{reminder.message}</p>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}