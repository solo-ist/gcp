export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: EventDateTime;
  end: EventDateTime;
  status: 'confirmed' | 'tentative' | 'cancelled';
  attendees?: Attendee[];
  organizer?: Organizer;
  htmlLink?: string;
  recurringEventId?: string;
  created?: string;
  updated?: string;
}

export interface EventDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface Attendee {
  email: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  self?: boolean;
  organizer?: boolean;
}

export interface Organizer {
  email: string;
  displayName?: string;
  self?: boolean;
}

export interface FreeBusyCalendar {
  calendarId: string;
  busy: TimePeriod[];
}

export interface TimePeriod {
  start: string;
  end: string;
}

export interface CreateEventParams {
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: EventDateTime;
  end: EventDateTime;
  attendees?: Array<{ email: string }>;
  timeZone?: string;
}

export interface ListEventsParams {
  calendarId: string;
  timeMin: string;
  timeMax: string;
  maxResults?: number;
  pageToken?: string;
  singleEvents?: boolean;
  timeZone?: string;
}

export interface ListEventsResult {
  events: CalendarEvent[];
  nextPageToken?: string;
}

export interface FreeBusyParams {
  timeMin: string;
  timeMax: string;
  calendarIds: string[];
  timeZone?: string;
}
