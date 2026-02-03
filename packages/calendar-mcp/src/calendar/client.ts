import { google, calendar_v3 } from 'googleapis';
import type { OAuth2Client } from 'googleapis-common';
import type {
  CalendarEvent,
  CreateEventParams,
  ListEventsParams,
  ListEventsResult,
  FreeBusyParams,
  FreeBusyCalendar,
} from './types.js';

export class CalendarClient {
  private calendar: calendar_v3.Calendar;

  constructor(auth: OAuth2Client) {
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async listEvents(params: ListEventsParams): Promise<ListEventsResult> {
    const response = await this.calendar.events.list({
      calendarId: params.calendarId,
      timeMin: params.timeMin,
      timeMax: params.timeMax,
      maxResults: params.maxResults ?? 100,
      pageToken: params.pageToken,
      singleEvents: params.singleEvents ?? true,
      orderBy: 'startTime',
      timeZone: params.timeZone,
    });

    const events = (response.data.items ?? []).map(this.mapEvent);
    return {
      events,
      nextPageToken: response.data.nextPageToken ?? undefined,
    };
  }

  async getEvent(calendarId: string, eventId: string): Promise<CalendarEvent> {
    const response = await this.calendar.events.get({
      calendarId,
      eventId,
    });
    return this.mapEvent(response.data);
  }

  async createEvent(params: CreateEventParams): Promise<CalendarEvent> {
    const response = await this.calendar.events.insert({
      calendarId: params.calendarId,
      requestBody: {
        summary: params.summary,
        description: params.description,
        location: params.location,
        start: params.start,
        end: params.end,
        attendees: params.attendees,
      },
    });
    return this.mapEvent(response.data);
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    await this.calendar.events.delete({
      calendarId,
      eventId,
    });
  }

  async queryFreeBusy(params: FreeBusyParams): Promise<FreeBusyCalendar[]> {
    const response = await this.calendar.freebusy.query({
      requestBody: {
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        timeZone: params.timeZone,
        items: params.calendarIds.map(id => ({ id })),
      },
    });

    const calendars = response.data.calendars ?? {};
    return Object.entries(calendars).map(([calendarId, data]) => ({
      calendarId,
      busy: (data.busy ?? []).map(period => ({
        start: period.start ?? '',
        end: period.end ?? '',
      })),
    }));
  }

  private mapEvent(event: calendar_v3.Schema$Event): CalendarEvent {
    return {
      id: event.id ?? '',
      summary: event.summary ?? '(No title)',
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      start: {
        dateTime: event.start?.dateTime ?? undefined,
        date: event.start?.date ?? undefined,
        timeZone: event.start?.timeZone ?? undefined,
      },
      end: {
        dateTime: event.end?.dateTime ?? undefined,
        date: event.end?.date ?? undefined,
        timeZone: event.end?.timeZone ?? undefined,
      },
      status: (event.status as CalendarEvent['status']) ?? 'confirmed',
      attendees: event.attendees?.map(a => ({
        email: a.email ?? '',
        displayName: a.displayName ?? undefined,
        responseStatus: a.responseStatus as any,
        self: a.self ?? undefined,
        organizer: a.organizer ?? undefined,
      })),
      organizer: event.organizer ? {
        email: event.organizer.email ?? '',
        displayName: event.organizer.displayName ?? undefined,
        self: event.organizer.self ?? undefined,
      } : undefined,
      htmlLink: event.htmlLink ?? undefined,
      recurringEventId: event.recurringEventId ?? undefined,
      created: event.created ?? undefined,
      updated: event.updated ?? undefined,
    };
  }
}
