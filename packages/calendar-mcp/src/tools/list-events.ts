import type { CalendarClient } from '../calendar/client.js';
import type { ListEventsInput } from './schemas.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

export async function listEvents(client: CalendarClient, input: ListEventsInput) {
  try {
    const result = await client.listEvents({
      calendarId: input.calendarId,
      timeMin: input.timeMin,
      timeMax: input.timeMax,
      maxResults: input.maxResults,
      pageToken: input.pageToken,
      timeZone: input.timeZone,
      singleEvents: true,
    });

    return jsonResponse({
      events: result.events.map(event => ({
        id: event.id,
        summary: event.summary,
        start: event.start.dateTime ?? event.start.date,
        end: event.end.dateTime ?? event.end.date,
        location: event.location,
        status: event.status,
        attendeeCount: event.attendees?.length,
        htmlLink: event.htmlLink,
      })),
      nextPageToken: result.nextPageToken,
      count: result.events.length,
    });
  } catch (error) {
    console.error('Failed to list events:', error);
    return errorResponse('Failed to list events. Please check the calendar ID and time range.');
  }
}
