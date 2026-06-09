"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Download,
  BriefcaseBusiness,
  Users,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Application } from "@/types/application";
import {
  buildAnalyticsStats,
  buildInsights,
  buildMonthlyTrend,
  buildStatusBreakdown,
  buildTopCompanies,
} from "@/services/analytics-service";
import PageHeader from "@/components/layout/page-header";
import EmptyState from "@/components/ui/empty-state";

const supabase = createClient();

const STATUS_COLORS = [
  "#6366f1",
  "#0f766e",
  "#f59e0b",
  "#06b6d4",
  "#22c55e",
  "#ef4444",
];

function formatPercent(value: number) {
  return `${value}%`;
}

function escapeCsv(value: string | number | null | undefined) {
  if (value === null || value === undefined) return '""';
  return `"${String(value).replaceAll('"', '""')}"`;
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApplications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/sign-in");
      return;
    }

    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setApplications((data as Application[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => buildAnalyticsStats(applications), [applications]);
  const statusData = useMemo(() => buildStatusBreakdown(applications), [applications]);
  const monthlyTrend = useMemo(() => buildMonthlyTrend(applications), [applications]);
  const topCompanies = useMemo(() => buildTopCompanies(applications), [applications]);
  const insights = useMemo(() => buildInsights(applications), [applications]);

  const exportCsv = () => {
    if (applications.length === 0) return;

    const rows = [
      [
        "Company",
        "Role",
        "Status",
        "Location",
        "Application Date",
        "Deadline",
        "Resume Version",
      ],
      ...applications.map((app) => [
        app.company_name,
        app.role_title,
        app.status,
        app.location ?? "",
        app.application_date ?? "",
        app.deadline ?? "",
        app.resume_version ?? "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((value) => escapeCsv(value)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "job-tracker-applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-muted-foreground">Loading analytics...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <PageHeader
        title="Analytics"
        description="Track funnel health, conversion rates, and application patterns from your own data."
        actions={
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={<BriefcaseBusiness className="h-4 w-4" />}
          label="Total Applications"
          value={stats.totalApplications}
        />
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          label="Interviews"
          value={stats.interviews}
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Interview Rate"
          value={formatPercent(stats.interviewRate)}
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Offer Rate"
          value={formatPercent(stats.offerRate)}
        />
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Rejections"
          value={stats.rejections}
        />
      </div>

      {applications.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No analytics yet"
            description="Add a few applications and move them through the pipeline to unlock charts and trends."
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <ChartCard title="Status distribution">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Monthly applications">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ChartCard title="Top companies">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topCompanies}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="company" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f766e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Insights</h2>
              <div className="mt-5 grid gap-4">
                {insights.map((insight) => (
                  <div key={insight.title} className="rounded-xl border p-4">
                    <p className="text-sm text-muted-foreground">{insight.title}</p>
                    <p className="mt-2 text-2xl font-bold">{insight.value}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="inline-flex rounded-xl border p-2">{icon}</div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}