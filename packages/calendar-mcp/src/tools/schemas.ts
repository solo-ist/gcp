import { z } from 'zod';

const timezoneSchema = z.string().refine(
  (tz) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Invalid IANA timezone name' }
);

export const listEventsSchema = z.object({
  calendarId: z.string().default('primary').describe('Calendar ID (use "primary" for the main calendar)'),
  timeMin: z.string().describe('Start of time range (ISO 8601 format)'),
  timeMax: z.string().describe('End of time range (ISO 8601 format)'),
  maxResults: z.number().min(1).max(2500).optional().describe('Maximum number of events to return'),
  pageToken: z.string().optional().describe('Token for pagination'),
  timeZone: timezoneSchema.optional().describe('IANA timezone name (e.g., "America/New_York")'),
});

export const getEventSchema = z.object({
  calendarId: z.string().default('primary').describe('Calendar ID (use "primary" for the main calendar)'),
  eventId: z.string().describe('Event ID'),
});

export const createEventSchema = z.object({
  calendarId: z.string().default('primary').describe('Calendar ID (use "primary" for the main calendar)'),
  summary: z.string().describe('Event title'),
  description: z.string().optional().describe('Event description'),
  location: z.string().optional().describe('Event location'),
  startDateTime: z.string().describe('Start time (ISO 8601 format)'),
  endDateTime: z.string().describe('End time (ISO 8601 format)'),
  timeZone: timezoneSchema.optional().describe('IANA timezone name for start/end times'),
  attendees: z.array(z.string().email()).optional().describe('List of attendee email addresses'),
});

export const deleteEventSchema = z.object({
  calendarId: z.string().default('primary').describe('Calendar ID (use "primary" for the main calendar)'),
  eventId: z.string().describe('Event ID to delete'),
});

export const findFreeTimeSchema = z.object({
  timeMin: z.string().describe('Start of time range (ISO 8601 format)'),
  timeMax: z.string().describe('End of time range (ISO 8601 format)'),
  calendarIds: z.array(z.string()).min(1).describe('List of calendar IDs to check'),
  timeZone: timezoneSchema.optional().describe('IANA timezone name'),
});

export type ListEventsInput = z.infer<typeof listEventsSchema>;
export type GetEventInput = z.infer<typeof getEventSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type DeleteEventInput = z.infer<typeof deleteEventSchema>;
export type FindFreeTimeInput = z.infer<typeof findFreeTimeSchema>;
