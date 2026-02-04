import { describe, it, expect } from 'vitest';
import {
  listEventsSchema,
  getEventSchema,
  createEventSchema,
  deleteEventSchema,
  findFreeTimeSchema,
} from './schemas.js';

describe('listEventsSchema', () => {
  it('should parse valid input', () => {
    const result = listEventsSchema.parse({
      timeMin: '2024-01-01T00:00:00Z',
      timeMax: '2024-01-31T23:59:59Z',
    });
    expect(result.calendarId).toBe('primary');
    expect(result.timeMin).toBe('2024-01-01T00:00:00Z');
    expect(result.timeMax).toBe('2024-01-31T23:59:59Z');
  });

  it('should accept custom calendarId', () => {
    const result = listEventsSchema.parse({
      calendarId: 'work@example.com',
      timeMin: '2024-01-01T00:00:00Z',
      timeMax: '2024-01-31T23:59:59Z',
    });
    expect(result.calendarId).toBe('work@example.com');
  });

  it('should validate timezone', () => {
    const result = listEventsSchema.parse({
      timeMin: '2024-01-01T00:00:00Z',
      timeMax: '2024-01-31T23:59:59Z',
      timeZone: 'America/New_York',
    });
    expect(result.timeZone).toBe('America/New_York');
  });

  it('should reject invalid timezone', () => {
    expect(() =>
      listEventsSchema.parse({
        timeMin: '2024-01-01T00:00:00Z',
        timeMax: '2024-01-31T23:59:59Z',
        timeZone: 'Invalid/Timezone',
      })
    ).toThrow();
  });

  it('should reject invalid datetime format', () => {
    expect(() =>
      listEventsSchema.parse({
        timeMin: 'not-a-date',
        timeMax: '2024-01-31T23:59:59Z',
      })
    ).toThrow();
  });

  it('should accept optional accountId', () => {
    const result = listEventsSchema.parse({
      accountId: 'work',
      timeMin: '2024-01-01T00:00:00Z',
      timeMax: '2024-01-31T23:59:59Z',
    });
    expect(result.accountId).toBe('work');
  });

  it('should reject invalid accountId format', () => {
    expect(() =>
      listEventsSchema.parse({
        accountId: 'user@example.com', // @ not allowed
        timeMin: '2024-01-01T00:00:00Z',
        timeMax: '2024-01-31T23:59:59Z',
      })
    ).toThrow();
  });
});

describe('getEventSchema', () => {
  it('should reject overly long eventId', () => {
    expect(() =>
      getEventSchema.parse({
        eventId: 'x'.repeat(300),
      })
    ).toThrow();
  });

  it('should reject overly long calendarId', () => {
    expect(() =>
      getEventSchema.parse({
        calendarId: 'x'.repeat(300),
        eventId: 'abc123',
      })
    ).toThrow();
  });
});

describe('createEventSchema', () => {
  it('should parse valid input', () => {
    const result = createEventSchema.parse({
      summary: 'Team Meeting',
      startDateTime: '2024-01-15T10:00:00-05:00',
      endDateTime: '2024-01-15T11:00:00-05:00',
    });
    expect(result.summary).toBe('Team Meeting');
    expect(result.calendarId).toBe('primary');
  });

  it('should validate attendee emails', () => {
    const result = createEventSchema.parse({
      summary: 'Team Meeting',
      startDateTime: '2024-01-15T10:00:00-05:00',
      endDateTime: '2024-01-15T11:00:00-05:00',
      attendees: ['alice@example.com', 'bob@example.com'],
    });
    expect(result.attendees).toEqual(['alice@example.com', 'bob@example.com']);
  });

  it('should reject invalid email', () => {
    expect(() =>
      createEventSchema.parse({
        summary: 'Team Meeting',
        startDateTime: '2024-01-15T10:00:00-05:00',
        endDateTime: '2024-01-15T11:00:00-05:00',
        attendees: ['not-an-email'],
      })
    ).toThrow();
  });

  it('should reject too many attendees', () => {
    const tooManyAttendees = Array(101).fill('user@example.com');
    expect(() =>
      createEventSchema.parse({
        summary: 'Team Meeting',
        startDateTime: '2024-01-15T10:00:00-05:00',
        endDateTime: '2024-01-15T11:00:00-05:00',
        attendees: tooManyAttendees,
      })
    ).toThrow();
  });

  it('should reject invalid datetime format', () => {
    expect(() =>
      createEventSchema.parse({
        summary: 'Team Meeting',
        startDateTime: 'tomorrow at 10am', // Invalid ISO 8601
        endDateTime: '2024-01-15T11:00:00-05:00',
      })
    ).toThrow();
  });
});

describe('findFreeTimeSchema', () => {
  it('should require at least one calendar', () => {
    expect(() =>
      findFreeTimeSchema.parse({
        timeMin: '2024-01-01T00:00:00Z',
        timeMax: '2024-01-31T23:59:59Z',
        calendarIds: [],
      })
    ).toThrow();
  });

  it('should accept multiple calendars', () => {
    const result = findFreeTimeSchema.parse({
      timeMin: '2024-01-01T00:00:00Z',
      timeMax: '2024-01-31T23:59:59Z',
      calendarIds: ['primary', 'work@example.com'],
    });
    expect(result.calendarIds).toHaveLength(2);
  });

  it('should reject too many calendars', () => {
    const tooManyCalendars = Array(51).fill('calendar@example.com');
    expect(() =>
      findFreeTimeSchema.parse({
        timeMin: '2024-01-01T00:00:00Z',
        timeMax: '2024-01-31T23:59:59Z',
        calendarIds: tooManyCalendars,
      })
    ).toThrow();
  });
});
