"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Application } from "@/types/application";
import type { Reminder } from "@/types/reminder";
import PageHeader from "@/components/layout/page-header";
import EmptyState from "@/components/ui/empty-state";

const supabase = createClient();

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function isDueSoon(reminderTime: string) {
  const diff = new Date(reminderTime).getTime() - Date.now();
  return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [error, setError] = useState("");

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/sign-in");
      return;
    }

    const [appsRes, remindersRes] = await Promise.all([
      supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .order("reminder_time", { ascending: true }),
    ]);

    if (appsRes.error) {
      setError(appsRes.error.message);
      setLoading(false);
      return;
    }

    if (remindersRes.error) {
      setError(remindersRes.error.message);
      setLoading(false);
      return;
    }

    setApplications((appsRes.data as Application[]) ?? []);
    setReminders((remindersRes.data as Reminder[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const totalApplications = applications.length;
    const activeApplications = applications.filter((app) =>
      ["Wishlist", "Applied", "OA", "Interview"].includes(app.status)
    ).length;
    const interviews = applications.filter((app) => app.status === "Interview").length;
    const offers = applications.filter((app) => app.status === "Offer").length;
    const dueReminders = reminders.filter(
      (reminder) => !reminder.is_sent && isDueSoon(reminder.reminder_time)
    ).length;

    return {
      totalApplications,
      activeApplications,
      interviews,
      offers,
      dueReminders,
    };
  }, [applications, reminders]);

  const recentApplications = applications.slice(0, 5);
  const urgentReminders = reminders
    .filter((reminder) => !reminder.is_sent && isDueSoon(reminder.reminder_time))
    .slice(0, 5);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        title="Dashboard"
        description="A clean overview of your internship applications, reminders, and pipeline progress."
        actions={
          <>
            <Link
              href="/applications"
              className="rounded-xl bg-black px-5 py-3 text-white transition hover:opacity-90"
            >
              Add Application
            </Link>
            <Link
              href="/reminders"
              className="rounded-xl border px-5 py-3 transition hover:bg-muted"
            >
              View Reminders
            </Link>
          </>
        }
      />

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Applications" value={stats.totalApplications} />
        <StatCard label="Active Pipeline" value={stats.activeApplications} />
        <StatCard label="Interviews" value={stats.interviews} />
        <StatCard label="Offers" value={stats.offers} />
        <StatCard label="Reminders Due" value={stats.dueReminders} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Recent Applications</h2>

          {recentApplications.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No applications added yet"
                description="Start by adding your first company application."
                action={
                  <Link
                    href="/applications"
                    className="rounded-xl bg-black px-5 py-3 text-white"
                  >
                    Add your first application
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              {recentApplications.map((item) => (
                <article key={item.id} className="rounded-xl border p-4">
                  <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                    <div>
                      <h3 className="font-semibold">{item.company_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.role_title}
                      </p>
                    </div>
                    <span className="rounded-full border px-3 py-1 text-xs">
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                    <p>Location: {item.location || "-"}</p>
                    <p>Deadline: {formatDate(item.deadline)}</p>
                    <p>Resume: {item.resume_version || "-"}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Upcoming Reminders</h2>

          {urgentReminders.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No urgent reminders"
                description="When deadlines or follow-ups are close, they will appear here."
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              {urgentReminders.map((reminder) => (
                <article key={reminder.id} className="rounded-xl border p-4">
                  <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                    <div>
                      <h3 className="font-semibold">{reminder.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {reminder.reminder_type}
                      </p>
                    </div>
                    <span className="rounded-full border px-3 py-1 text-xs">
                      {reminder.channel}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                    <p>Reminder time: {new Date(reminder.reminder_time).toLocaleString()}</p>
                    <p>Status: {reminder.delivery_status}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Quick Links</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/applications" className="rounded-xl border px-4 py-2">
            Applications
          </Link>
          <Link href="/pipeline" className="rounded-xl border px-4 py-2">
            Pipeline
          </Link>
          <Link href="/analytics" className="rounded-xl border px-4 py-2">
            Analytics
          </Link>
          <Link href="/reminders" className="rounded-xl border px-4 py-2">
            Reminders
          </Link>
          <Link href="/settings" className="rounded-xl border px-4 py-2">
            Settings
          </Link>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}