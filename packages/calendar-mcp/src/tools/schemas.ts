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

// ISO 8601 datetime validation
const iso8601DateTimeSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid ISO 8601 datetime format' }
);

// Validated string schemas with length limits
const calendarIdSchema = z.string().min(1).max(256).default('primary')
  .describe('Calendar ID (use "primary" for the main calendar)');
const eventIdSchema = z.string().min(1).max(256).describe('Event ID');
const accountIdSchema = z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/).optional()
  .describe('Account ID to use (defaults to first configured account)');

export const listEventsSchema = z.object({
  accountId: accountIdSchema,
  calendarId: calendarIdSchema,
  timeMin: iso8601DateTimeSchema.describe('Start of time range (ISO 8601 format)'),
  timeMax: iso8601DateTimeSchema.describe('End of time range (ISO 8601 format)'),
  maxResults: z.number().min(1).max(2500).optional().describe('Maximum number of events to return'),
  pageToken: z.string().max(2048).optional().describe('Token for pagination'),
  timeZone: timezoneSchema.optional().describe('IANA timezone name (e.g., "America/New_York")'),
});

export const getEventSchema = z.object({
  accountId: accountIdSchema,
  calendarId: calendarIdSchema,
  eventId: eventIdSchema,
});

export const createEventSchema = z.object({
  accountId: accountIdSchema,
  calendarId: calendarIdSchema,
  summary: z.string().min(1).max(1024).describe('Event title'),
  description: z.string().max(8192).optional().describe('Event description'),
  location: z.string().max(1024).optional().describe('Event location'),
  startDateTime: iso8601DateTimeSchema.describe('Start time (ISO 8601 format)'),
  endDateTime: iso8601DateTimeSchema.describe('End time (ISO 8601 format)'),
  timeZone: timezoneSchema.optional().describe('IANA timezone name for start/end times'),
  attendees: z.array(z.string().email()).max(100).optional().describe('List of attendee email addresses'),
});

export const deleteEventSchema = z.object({
  accountId: accountIdSchema,
  calendarId: calendarIdSchema,
  eventId: eventIdSchema.describe('Event ID to delete'),
});

export const findFreeTimeSchema = z.object({
  accountId: accountIdSchema,
  timeMin: iso8601DateTimeSchema.describe('Start of time range (ISO 8601 format)'),
  timeMax: iso8601DateTimeSchema.describe('End of time range (ISO 8601 format)'),
  calendarIds: z.array(z.string().min(1).max(256)).min(1).max(50).describe('List of calendar IDs to check'),
  timeZone: timezoneSchema.optional().describe('IANA timezone name'),
});

export type ListEventsInput = z.infer<typeof listEventsSchema>;
export type GetEventInput = z.infer<typeof getEventSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type DeleteEventInput = z.infer<typeof deleteEventSchema>;
export type FindFreeTimeInput = z.infer<typeof findFreeTimeSchema>;
