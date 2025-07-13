// Calendar integration utilities for client-side use
// These functions generate URLs and calendar files without server dependencies

export interface CalendarEventData {
  title: string;
  description?: string;
  dueDate: Date;
  reminderTime?: Date;
}

export function generateGoogleCalendarUrl(event: CalendarEventData): string {
  const { title, description, dueDate, reminderTime } = event;
  
  const startDate = reminderTime ?? dueDate;
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: description ?? `Reminder: ${title}`,
    location: '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateOutlookCalendarUrl(event: CalendarEventData): string {
  const { title, description, dueDate, reminderTime } = event;
  
  const startDate = reminderTime ?? dueDate;
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  const params = new URLSearchParams({
    subject: title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: description ?? `Reminder: ${title}`,
    location: '',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function generateCalendarEvent(event: CalendarEventData): { icalContent: string; filename: string } {
  const { title, description, dueDate, reminderTime } = event;
  
  const startDate = reminderTime ?? dueDate;
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  const formatICalDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const now = new Date();
  const uid = `reminder-${Date.now()}@smartreminder.app`;

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Smart Reminder//Reminder Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICalDate(now)}Z`,
    `DTSTART:${formatICalDate(startDate)}Z`,
    `DTEND:${formatICalDate(endDate)}Z`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description ?? `Reminder: ${title}`}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${title}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const filename = `reminder-${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;

  return { icalContent, filename };
}
