/** Totals of the audit trail for a period (backbone `UsageSummaryTO`). */
export interface UsageSummary {
  from: string;
  to: string;
  events: number;
  logins: number;
  failures: number;
  logouts: number;
  passwordChanges: number;
  otherEvents: number;
  activeUsers: number;
  sourceIps: number;
  applications: number;
  /** Failed logins over all login attempts, between 0 and 1. */
  failureRate: number;
  firstEvent: string | null;
  lastEvent: string | null;
}

/** One bucket of the usage time series (`UsagePointTO`). `period` is its first day, `yyyy-MM-dd`. */
export interface UsagePoint {
  period: string;
  logins: number;
  failures: number;
  logouts: number;
  activeUsers: number;
}

/** Successful logins in one hour of the day, 0 to 23 (`HourBucketTO`). */
export interface HourBucket {
  hour: number;
  logins: number;
}

/** Successful logins in one ISO day of the week (1 Monday to 7 Sunday) and four-hour slot 0 to 5 (`HeatCellTO`). */
export interface HeatCell {
  dayOfWeek: number;
  slot: number;
  logins: number;
}

/** Usage and reach of one application (`ApplicationUsageTO`). */
export interface ApplicationUsage {
  applicationId: string | null;
  applicationName: string | null;
  events: number;
  logins: number;
  failures: number;
  activeUsers: number;
  registeredUsers: number;
  roles: number;
}

export type DeviceClass = 'DESKTOP_BROWSER' | 'MOBILE_BROWSER' | 'API_CLIENT' | 'OTHER' | 'UNKNOWN';

/** Events grouped by kind of client (`ClientBreakdownTO`). */
export interface ClientBreakdown {
  deviceClass: DeviceClass | string;
  browser: string;
  events: number;
}

export type Granularity = 'day' | 'week' | 'month';

/** Filters every report accepts. Empty values mean "not set". */
export interface UsageFilters {
  applicationId?: string;
  /** First day, `yyyy-MM-dd`. */
  from?: string;
  /** Last day, `yyyy-MM-dd`. */
  to?: string;
}

/** Everything the usage page shows, loaded together. */
export interface UsageReportSet {
  summary: UsageSummary;
  weekly: UsagePoint[];
  monthly: UsagePoint[];
  hours: HourBucket[];
  heatmap: HeatCell[];
  applications: ApplicationUsage[];
  clients: ClientBreakdown[];
}
