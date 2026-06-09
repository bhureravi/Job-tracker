import type { Application } from "@/types/application";
import type {
  AnalyticsStats,
  CompanyChartPoint,
  InsightCard,
  MonthlyTrendPoint,
  StatusChartPoint,
} from "@/types/analytics";

const STATUS_ORDER: Array<Application["status"]> = [
  "Wishlist",
  "Applied",
  "OA",
  "Interview",
  "Offer",
  "Rejected",
];

function getRelevantDate(application: Application) {
  return application.application_date
    ? new Date(application.application_date)
    : new Date(application.created_at);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function buildAnalyticsStats(applications: Application[]): AnalyticsStats {
  const totalApplications = applications.length;
  const interviews = applications.filter((app) => app.status === "Interview").length;
  const offers = applications.filter((app) => app.status === "Offer").length;
  const rejections = applications.filter((app) => app.status === "Rejected").length;

  return {
    totalApplications,
    interviews,
    offers,
    rejections,
    interviewRate: totalApplications ? Math.round((interviews / totalApplications) * 100) : 0,
    offerRate: totalApplications ? Math.round((offers / totalApplications) * 100) : 0,
  };
}

export function buildStatusBreakdown(applications: Application[]): StatusChartPoint[] {
  return STATUS_ORDER.map((status) => ({
    name: status,
    value: applications.filter((app) => app.status === status).length,
  })).filter((item) => item.value > 0);
}

export function buildMonthlyTrend(applications: Application[]): MonthlyTrendPoint[] {
  const buckets = new Map<string, { date: Date; count: number }>();

  for (const application of applications) {
    const date = getRelevantDate(application);
    const key = monthKey(date);

    if (!buckets.has(key)) {
      buckets.set(key, {
        date: new Date(date.getFullYear(), date.getMonth(), 1),
        count: 0,
      });
    }

    buckets.get(key)!.count += 1;
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((item) => ({
      month: monthLabel(item.date),
      count: item.count,
    }));
}

export function buildTopCompanies(
  applications: Application[],
  limit = 5
): CompanyChartPoint[] {
  const counts = new Map<string, number>();

  for (const application of applications) {
    counts.set(
      application.company_name,
      (counts.get(application.company_name) ?? 0) + 1
    );
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([company, count]) => ({
      company,
      count,
    }));
}

export function buildInsights(applications: Application[]): InsightCard[] {
  if (applications.length === 0) {
    return [
      {
        title: "Start adding applications",
        value: "No data yet",
        description:
          "Once you add 5–10 applications, this dashboard will show meaningful trends and conversion patterns.",
      },
      {
        title: "Track outcomes",
        value: "Status-based funnel",
        description:
          "Move cards through Wishlist, Applied, OA, Interview, Offer, and Rejected to get better analytics.",
      },
      {
        title: "Use deadlines well",
        value: "Reminder-ready",
        description:
          "Deadlines and follow-ups become more useful when every application has dates attached.",
      },
    ];
  }

  const stats = buildAnalyticsStats(applications);
  const statusBreakdown = buildStatusBreakdown(applications);
  const topStage = [...statusBreakdown].sort((a, b) => b.value - a.value)[0];
  const pendingApplications = applications.filter(
    (app) => app.status === "Applied" || app.status === "Wishlist"
  ).length;

  const insights: InsightCard[] = [
    {
      title: "Most common stage",
      value: topStage ? `${topStage.name} (${topStage.value})` : "No stage data",
      description: "This shows where most of your applications currently sit.",
    },
    {
      title: "Application balance",
      value:
        pendingApplications > applications.length / 2
          ? "Early-stage heavy"
          : "Healthy spread",
      description:
        "A balanced funnel usually means you are moving applications forward instead of only adding new ones.",
    },
    {
      title: "Interview progress",
      value: `${stats.interviewRate}%`,
      description:
        stats.interviews > 0
          ? "You are converting applications into interviews. Keep improving the pipeline."
          : "No interview-stage progress yet. The next goal is to improve shortlist conversion.",
    },
  ];

  if (stats.offers > 0) {
    insights.push({
      title: "Offer signal",
      value: `${stats.offers} offer${stats.offers === 1 ? "" : "s"}`,
      description:
        "You already have offer-stage success in the dataset. That is the strongest signal in the project.",
    });
  }

  return insights;
}