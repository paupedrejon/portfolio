export const ANALYTICS_EVENT_TYPES = [
  "page_view",
  "projects_view_change",
  "project_filter",
  "project_view",
  "cv_download",
  "study_agents_view",
  "react_course_view",
  "locale_view",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export type AnalyticsEventInput = {
  event_type: AnalyticsEventType | string;
  path?: string | null;
  session_id?: string | null;
  metadata?: Record<string, unknown>;
};
