import type { CalendarClient } from '../calendar/client.js';
import type { CreateEventInput } from './schemas.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

export async function createEvent(client: CalendarClient, input: CreateEventInput) {
  try {
    const event = await client.createEvent({
      calendarId: input.calendarId,
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: {
        dateTime: input.startDateTime,
        timeZone: input.timeZone,
      },
      end: {
        dateTime: input.endDateTime,
        timeZone: input.timeZone,
      },
      attendees: input.attendees?.map(email => ({ email })),
    });

    return jsonResponse({
      id: event.id,
      summary: event.summary,
      start: event.start.dateTime ?? event.start.date,
      end: event.end.dateTime ?? event.end.date,
      htmlLink: event.htmlLink,
      status: event.status,
    });
  } catch (error) {
    console.error('Failed to create event:', error);
    return errorResponse('Failed to create event. Please check the event details and try again.');
  }
}
