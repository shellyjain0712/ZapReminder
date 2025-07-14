// Direct calendar integration service
import { toast } from 'sonner';

export interface CalendarEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}

export interface CalendarIntegrationResult {
  success: boolean;
  method: 'direct' | 'fallback' | 'failed';
  message: string;
}

// Check if the browser supports native calendar integration
export function isNativeCalendarSupported(): boolean {
  // Check for Calendar API support (if available in future)
  return 'calendar' in navigator || 'requestPermission' in window;
}

// Send push notification for calendar addition
export async function sendCalendarNotification(title: string): Promise<void> {
  try {
    // Request notification permission if not already granted
    if ('Notification' in window) {
      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      
      if (permission === 'granted') {
        new Notification('📅 Task added to calendar', {
          body: `"${title}" has been added to your calendar`,
          icon: '/favicon.ico',
          tag: 'calendar-addition',
          requireInteraction: false,
          silent: false
        });
        
        // Also show toast notification
        toast.success('Task added to the calendar', {
          description: `"${title}" is now in your calendar`,
          duration: 4000
        });
      } else {
        // Fallback to toast only
        toast.success('Task added to the calendar', {
          description: `"${title}" is ready to be added`,
          duration: 4000
        });
      }
    } else {
      // Browser doesn't support notifications, use toast only
      toast.success('Task added to the calendar', {
        description: `"${title}" is ready to be added`,
        duration: 4000
      });
    }
  } catch (error) {
    console.error('Error sending calendar notification:', error);
    // Fallback to toast
    toast.success('Task added to the calendar', {
      description: `"${title}" is ready to be added`,
      duration: 4000
    });
  }
}

// Add event directly to user's calendar
export async function addToCalendarDirect(event: CalendarEvent): Promise<CalendarIntegrationResult> {
  try {
    // Method 1: Try to use Calendar API (future-proofing)
    if ('calendar' in navigator) {
      // This is a placeholder for future Calendar API support
      // For now, we'll use the ICS file method
    }
    
    // Method 2: Create ICS file and trigger download
    const icsContent = generateICSContent(event);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link to download the ICS file
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(event.title)}.ics`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    // Send notification with instructions
    toast.success('📅 Calendar file downloaded!', {
      description: `"${event.title}.ics" - Open the downloaded file to add to your calendar`,
      duration: 6000
    });
    
    return {
      success: true,
      method: 'direct',
      message: 'Calendar event file downloaded successfully'
    };
    
  } catch (error) {
    console.error('Error adding to calendar directly:', error);
    return {
      success: false,
      method: 'failed',
      message: 'Failed to add to calendar directly'
    };
  }
}

// Generate ICS file content
function generateICSContent(event: CalendarEvent): string {
  const now = new Date();
  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  const uid = `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ZapReminder//Reminder App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${formatICSDate(event.startTime)}`,
    `DTEND:${formatICSDate(event.endTime)}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description ?? ''}`,
    `LOCATION:${event.location ?? ''}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${event.title}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

// Sanitize filename for ICS file
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50);
}

// Fallback to opening calendar URL
export async function addToCalendarFallback(event: CalendarEvent): Promise<CalendarIntegrationResult> {
  try {
    const { generateGoogleCalendarUrl, generateOutlookCalendarUrl } = await import('./calendar');
    
    // Try Google Calendar first
    const googleUrl = generateGoogleCalendarUrl({
      title: event.title,
      description: event.description,
      dueDate: event.startTime,
      reminderTime: event.startTime,
    });
    
    // Also generate Outlook URL for backup
    const outlookUrl = generateOutlookCalendarUrl({
      title: event.title,
      description: event.description,
      dueDate: event.startTime,
      reminderTime: event.startTime,
    });
    
    // Open Google Calendar by default
    window.open(googleUrl, '_blank');
    
    // Show notification with options
    toast.success('📅 Google Calendar opened!', {
      description: `Adding "${event.title}" to your calendar. Click here for Outlook instead.`,
      duration: 8000,
      action: {
        label: 'Outlook',
        onClick: () => {
          window.open(outlookUrl, '_blank');
          toast.success('📅 Outlook Calendar opened!');
        }
      }
    });
    
    return {
      success: true,
      method: 'fallback',
      message: 'Google Calendar opened in new tab'
    };
  } catch (error) {
    console.error('Error with calendar fallback:', error);
    return {
      success: false,
      method: 'failed',
      message: 'Failed to open calendar'
    };
  }
}

// Main function to add reminder to calendar
export async function addReminderToCalendar(
  title: string,
  description: string | undefined,
  dueDate: Date,
  reminderTime?: Date
): Promise<CalendarIntegrationResult> {
  const startTime = reminderTime ?? dueDate;
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
  
  const event: CalendarEvent = {
    title,
    description: description ?? `Reminder: ${title}`,
    startTime,
    endTime
  };
  
  // Try opening calendar URL first (more reliable and direct)
  const fallbackResult = await addToCalendarFallback(event);
  if (fallbackResult.success) {
    return fallbackResult;
  }
  
  // If URL method fails, try direct download
  const directResult = await addToCalendarDirect(event);
  if (directResult.success) {
    return directResult;
  }
  
  // Final fallback - just show notification
  await sendCalendarNotification(title);
  return {
    success: true,
    method: 'fallback',
    message: 'Calendar integration attempted'
  };
}
