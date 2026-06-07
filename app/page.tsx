import Link from "next/link";
import { ArrowRight, Bell, BarChart3, KanbanSquare } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border px-4 py-1 text-sm">
            Smart Internship & Job Tracker
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Track applications, reminders, interviews, and analytics in one place.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            A polished job tracker with pipeline management, deadline reminders,
            resume tracking, and analytics built for internship preparation.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-white transition hover:opacity-90"
            >
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/applications"
              className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 transition hover:bg-muted"
            >
              View Applications
            </Link>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={<KanbanSquare className="h-5 w-5" />}
              title="Pipeline board"
              description="Move applications through Applied, OA, Interview, Offer, and Rejected."
            />
            <FeatureCard
              icon={<Bell className="h-5 w-5" />}
              title="Smart reminders"
              description="Get reminders for deadlines, follow-ups, and interview dates."
            />
            <FeatureCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="Analytics"
              description="See conversion rates, stage-wise progress, and monthly trends."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-3 inline-flex rounded-xl border p-2">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}