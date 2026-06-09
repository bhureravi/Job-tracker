export interface AnalyticsStats {
  totalApplications: number;
  interviews: number;
  offers: number;
  rejections: number;
  interviewRate: number;
  offerRate: number;
}

export interface StatusChartPoint {
  name: string;
  value: number;
}

export interface MonthlyTrendPoint {
  month: string;
  count: number;
}

export interface CompanyChartPoint {
  company: string;
  count: number;
}

export interface InsightCard {
  title: string;
  value: string;
  description: string;
}