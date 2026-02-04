import type { CalendarClient } from '../calendar/client.js';
import type { FindFreeTimeInput } from './schemas.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

export async function findFreeTime(client: CalendarClient, input: FindFreeTimeInput) {
  try {
    const result = await client.queryFreeBusy({
      timeMin: input.timeMin,
      timeMax: input.timeMax,
      calendarIds: input.calendarIds,
      timeZone: input.timeZone,
    });

    return jsonResponse({
      timeRange: {
        start: input.timeMin,
        end: input.timeMax,
      },
      calendars: result.map(cal => ({
        calendarId: cal.calendarId,
        busyPeriods: cal.busy,
        busyCount: cal.busy.length,
      })),
    });
  } catch (error) {
    console.error('Failed to query free/busy:', error);
    return errorResponse('Failed to query free/busy information. Please check the calendar IDs and time range.');
  }
}
