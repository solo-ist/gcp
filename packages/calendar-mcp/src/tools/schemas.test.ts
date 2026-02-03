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
});
