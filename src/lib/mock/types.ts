export type InboxTier = "blocking" | "actionable" | "report" | "ambient";

export type InboxItem = {
  id: string;
  tier: InboxTier;
  title: string;
  summary: string;
  body: string[];
  from: string;
  dateLabel: string;
  actions?: string[];
};

export type Member = {
  id: string;
  nameJa: string;
  nameReading: string;
  portraitSrc: string;
  role: string;
  birthdate: string;
  note: string;
};

export type ManageModule = {
  id: string;
  nameJa: string;
  nameEn: string;
  blurb: string;
};

export type CalendarEvent = {
  id: string;
  dateLabel: string;
  title: string;
  kind: string;
  note: string;
};
