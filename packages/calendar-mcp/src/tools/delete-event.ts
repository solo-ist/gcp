import type { CalendarClient } from '../calendar/client.js';
import type { DeleteEventInput } from './schemas.js';
import { textResponse, errorResponse } from '../utils/response.js';

export async function deleteEvent(client: CalendarClient, input: DeleteEventInput) {
  try {
    await client.deleteEvent(input.calendarId, input.eventId);
    return textResponse(`Event ${input.eventId} deleted successfully`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to delete event: ${message}`);
  }
}
