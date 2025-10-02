import { GoogleAPIClient } from '../google-api';
import { db } from '@/db/index';
import { adminAssistantAudit } from '@/db/db-schema';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  organizer?: {
    email: string;
    displayName?: string;
  };
  htmlLink?: string;
  status?: string;
}

export interface CalendarListParams {
  timeMin?: Date;
  timeMax?: Date;
  maxResults?: number;
  orderBy?: 'startTime' | 'updated';
  singleEvents?: boolean;
  calendarId?: string;
}

/**
 * CalendarService integrates with Google Calendar API
 * Provides access to user's calendar events
 */
export class CalendarService {
  private googleClient: GoogleAPIClient;
  private userEmail: string;

  constructor(userEmail: string) {
    this.userEmail = userEmail;
    this.googleClient = new GoogleAPIClient(userEmail);
  }

  /**
   * List events from user's primary calendar
   */
  async listEvents(params?: CalendarListParams): Promise<CalendarEvent[]> {
    

    try {
      const calendar = await this.googleClient.getCalendarClient();

      // Default to today if no time range specified
      const timeMin = params?.timeMin || new Date();
      timeMin.setHours(0, 0, 0, 0);

      const timeMax = params?.timeMax || new Date(timeMin);
      timeMax.setDate(timeMax.getDate() + 1);
      timeMax.setHours(23, 59, 59, 999);

      const response = await calendar.events.list({
        calendarId: params?.calendarId || 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: params?.maxResults || 250,
        singleEvents: params?.singleEvents !== false, // Default to true
        orderBy: params?.orderBy || 'startTime',
      });

      const events = response.data.items || [];

      // Log successful access
      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          action: 'calendar_read',
          details: {
            operation: 'list_events',
            eventCount: events.length,
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
          },
        });
      }

      return events.map(event => this.mapEventToInterface(event));
    } catch (error) {
      console.error('Failed to list calendar events:', error);

      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          action: 'calendar_read_error',
          details: {
            operation: 'list_events',
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }

      throw new Error(`Failed to list calendar events: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get events for today
   */
  async getTodayEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.listEvents({
      timeMin: today,
      timeMax: tomorrow,
    });
  }

  /**
   * Get upcoming events (next N days)
   */
  async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);

    return this.listEvents({
      timeMin: start,
      timeMax: end,
    });
  }

  /**
   * Get events for a specific date
   */
  async getEventsForDate(date: Date): Promise<CalendarEvent[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.listEvents({
      timeMin: start,
      timeMax: end,
    });
  }

  /**
   * Get events in a date range
   */
  async getEventsInRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    return this.listEvents({
      timeMin: startDate,
      timeMax: endDate,
    });
  }

  /**
   * Format event for display
   */
  formatEvent(event: CalendarEvent): string {
    const lines: string[] = [];

    // Time
    const startTime = this.formatEventTime(event.start);
    const endTime = this.formatEventTime(event.end);
    lines.push(`${startTime} - ${endTime}`);

    // Summary
    lines.push(event.summary);

    // Location
    if (event.location) {
      lines.push(`📍 ${event.location}`);
    }

    // Attendees
    if (event.attendees && event.attendees.length > 0) {
      const attendeeNames = event.attendees
        .map(a => a.displayName || a.email)
        .join(', ');
      lines.push(`👥 ${attendeeNames}`);
    }

    return lines.join('\n');
  }

  /**
   * Format multiple events as a summary
   */
  formatEventsSummary(events: CalendarEvent[]): string {
    if (events.length === 0) {
      return 'No events scheduled.';
    }

    const lines: string[] = [];
    lines.push(`You have ${events.length} event${events.length > 1 ? 's' : ''}:`);
    lines.push('');

    for (const event of events) {
      lines.push(this.formatEvent(event));
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Map Google Calendar API event to our interface
   */
  private mapEventToInterface(event: any): CalendarEvent {
    return {
      id: event.id || '',
      summary: event.summary || 'Untitled Event',
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start?.dateTime,
        date: event.start?.date,
        timeZone: event.start?.timeZone,
      },
      end: {
        dateTime: event.end?.dateTime,
        date: event.end?.date,
        timeZone: event.end?.timeZone,
      },
      attendees: event.attendees?.map((a: any) => ({
        email: a.email || '',
        displayName: a.displayName,
        responseStatus: a.responseStatus,
      })),
      organizer: event.organizer ? {
        email: event.organizer.email || '',
        displayName: event.organizer.displayName,
      } : undefined,
      htmlLink: event.htmlLink,
      status: event.status,
    };
  }

  /**
   * Format event time for display
   */
  private formatEventTime(time: CalendarEvent['start'] | CalendarEvent['end']): string {
    if (time.dateTime) {
      const date = new Date(time.dateTime);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (time.date) {
      return 'All day';
    }
    return 'Unknown time';
  }

  /**
   * Check if calendar is accessible
   */
  async checkAccess(): Promise<boolean> {
    try {
      const calendar = await this.googleClient.getCalendarClient();
      await calendar.calendarList.list({ maxResults: 1 });
      return true;
    } catch (error) {
      console.error('Calendar access check failed:', error);
      return false;
    }
  }
}
