export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        This will show stats, reminders, recent applications, and analytics.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border p-5">
          <p className="text-sm text-muted-foreground">Total Applications</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-2xl border p-5">
          <p className="text-sm text-muted-foreground">Interviews</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-2xl border p-5">
          <p className="text-sm text-muted-foreground">Offers</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
      </div>
    </main>
  );
}