import type { CalendarClient } from '../calendar/client.js';
import type { DeleteEventInput } from './schemas.js';
import { textResponse, errorResponse } from '../utils/response.js';

export async function deleteEvent(client: CalendarClient, input: DeleteEventInput) {
  try {
    await client.deleteEvent(input.calendarId, input.eventId);
    return textResponse('Event deleted successfully');
  } catch (error) {
    console.error('Failed to delete event:', error);
    return errorResponse('Failed to delete event. Please check the calendar ID and event ID.');
  }
}
