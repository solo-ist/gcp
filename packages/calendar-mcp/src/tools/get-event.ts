import type { CalendarClient } from '../calendar/client.js';
import type { GetEventInput } from './schemas.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

export async function getEvent(client: CalendarClient, input: GetEventInput) {
  try {
    const event = await client.getEvent(input.calendarId, input.eventId);

    return jsonResponse({
      id: event.id,
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: event.start,
      end: event.end,
      status: event.status,
      attendees: event.attendees,
      organizer: event.organizer,
      htmlLink: event.htmlLink,
      recurringEventId: event.recurringEventId,
      created: event.created,
      updated: event.updated,
    });
  } catch (error) {
    console.error('Failed to get event:', error);
    return errorResponse('Failed to get event. Please check the calendar ID and event ID.');
  }
}
