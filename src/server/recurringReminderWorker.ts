import { db } from "./db";
import { sendReminderNotification } from "../lib/notifications";

type ReminderData = {
  id: string;
  title: string;
  dueDate: Date;
  reminderTime?: Date | null;
  notificationTime?: Date | null;
  reminderInterval?: number | null; // Interval in minutes between reminder notifications
  lastNotificationSent?: Date | null; // Track when last notification was sent
  isRecurring: boolean;
  recurrenceType?: string | null;
  recurrenceInterval?: number | null;
  user: {
    email: string;
    name?: string | null;
  };
};

// Helper to get days between two dates
function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// Helper to check if a reminder time matches current time (within 5 minutes)
function isReminderTimeNow(reminderTime: Date, now: Date): boolean {
  const timeDiff = Math.abs(reminderTime.getTime() - now.getTime());
  return timeDiff <= 300000; // Within 5 minutes
}

// Helper to check if it's time for advance notification - handles both notification time and 1-hour-before logic
function isAdvanceNotificationTime(targetTime: Date, now: Date, useExactTime = false): boolean {
  if (useExactTime) {
    // For user-set notification time, check if it's within 5 minutes of the target time (more lenient)
    const timeDiff = Math.abs(targetTime.getTime() - now.getTime());
    const withinRange = timeDiff <= 300000; // Within 5 minutes
    console.log(`isAdvanceNotificationTime (exact): target=${targetTime.toISOString()}, now=${now.toISOString()}, diff=${timeDiff}ms, within=${withinRange}`);
    return withinRange;
  } else {
    // For 1-hour-before logic
    const oneHourBefore = new Date(targetTime.getTime() - (60 * 60 * 1000)); // 1 hour before
    const timeDiff = Math.abs(oneHourBefore.getTime() - now.getTime());
    const withinRange = timeDiff <= 300000; // Within 5 minutes of 1 hour before
    console.log(`isAdvanceNotificationTime (1hr before): target=${oneHourBefore.toISOString()}, now=${now.toISOString()}, diff=${timeDiff}ms, within=${withinRange}`);
    return withinRange;
  }
}

// Helper to check if it's time for a specific reminder
function shouldSendReminderNow(reminder: ReminderData, now: Date): boolean {
  if (!reminder.reminderTime) return false;
  
  const reminderDateTime = new Date(reminder.reminderTime);
  const dueDate = new Date(reminder.dueDate);
  
  // For recurring reminders, check if today matches the pattern and time matches
  if (reminder.isRecurring) {
    const daysToDue = daysBetween(now, dueDate);
    
    // Check if today is a recurring day
    if (daysToDue === 0) {
      return isReminderTimeNow(reminderDateTime, now);
    }
    
    // For recurring reminders, also check if it's a regular occurrence
    const daysSinceStart = Math.abs(daysBetween(dueDate, now));
    const interval = reminder.recurrenceInterval ?? 1;
    
    switch (reminder.recurrenceType) {
      case "DAILY":
        if (daysSinceStart % interval === 0) {
          return isReminderTimeNow(reminderDateTime, now);
        }
        break;
      case "WEEKLY":
        if (daysSinceStart % (7 * interval) === 0) {
          return isReminderTimeNow(reminderDateTime, now);
        }
        break;
      case "MONTHLY":
        // For monthly, check if it's the same day of month
        if (now.getDate() === dueDate.getDate()) {
          return isReminderTimeNow(reminderDateTime, now);
        }
        break;
    }
  } else {
    // For non-recurring reminders, check if it's the exact reminder time
    return isReminderTimeNow(reminderDateTime, now);
  }
  
  return false;
}

// Helper to check if it's time for advance notification
function shouldSendAdvanceNotification(reminder: ReminderData, now: Date): boolean {
  // Check if there's a notificationTime set
  if (reminder.notificationTime) {
    const notificationDateTime = new Date(reminder.notificationTime);
    
    console.log(`Checking advance notification for "${reminder.title}":
      - Notification time: ${notificationDateTime.toISOString()} (${notificationDateTime.toLocaleString()})
      - Current time: ${now.toISOString()} (${now.toLocaleString()})
      - Time difference: ${Math.abs(notificationDateTime.getTime() - now.getTime())} ms
      - Within 5 minutes: ${isAdvanceNotificationTime(notificationDateTime, now, true)}
      - Last notification sent: ${reminder.lastNotificationSent?.toISOString() ?? 'Never'}
      - Reminder interval: ${reminder.reminderInterval ?? 60} minutes`);
    
    // Check if we should send the initial advance notification
    const isInitialNotificationTime = isAdvanceNotificationTime(notificationDateTime, now, true);
    
    // Check if we should send a repeat reminder (after initial notification was sent)
    let shouldSendRepeat = false;
    if (reminder.lastNotificationSent && reminder.reminderInterval) {
      const timeSinceLastNotification = now.getTime() - reminder.lastNotificationSent.getTime();
      const intervalMs = reminder.reminderInterval * 60 * 1000; // Convert minutes to milliseconds
      shouldSendRepeat = timeSinceLastNotification >= intervalMs;
      
      console.log(`Repeat reminder check:
        - Time since last: ${Math.round(timeSinceLastNotification / 1000 / 60)} minutes
        - Interval: ${reminder.reminderInterval} minutes
        - Should repeat: ${shouldSendRepeat}`);
    }
    
    // For non-recurring reminders, send notification if it's either the initial time OR time for a repeat
    if (!reminder.isRecurring) {
      if (isInitialNotificationTime && !reminder.lastNotificationSent) {
        console.log(`✅ Initial advance notification time for "${reminder.title}"`);
        return true;
      } else if (shouldSendRepeat) {
        console.log(`✅ Repeat reminder time for "${reminder.title}"`);
        return true;
      }
      return false;
    }
    
    // For recurring reminders, check if today matches the pattern and it's notification time
    const dueDate = new Date(reminder.dueDate);
    const daysToDue = daysBetween(now, dueDate);
    
    // Check if today is a recurring day
    if (daysToDue === 0) {
      return isAdvanceNotificationTime(notificationDateTime, now, true);
    }
    
    // For recurring reminders, also check if it's a regular occurrence
    const daysSinceStart = Math.abs(daysBetween(dueDate, now));
    const interval = reminder.recurrenceInterval ?? 1;
    
    switch (reminder.recurrenceType) {
      case "DAILY":
        if (daysSinceStart % interval === 0) {
          return isAdvanceNotificationTime(notificationDateTime, now, true);
        }
        break;
      case "WEEKLY":
        if (daysSinceStart % (7 * interval) === 0) {
          return isAdvanceNotificationTime(notificationDateTime, now, true);
        }
        break;
      case "MONTHLY":
        if (now.getDate() === dueDate.getDate()) {
          return isAdvanceNotificationTime(notificationDateTime, now, true);
        }
        break;
    }
  }
  
  // Fallback: if no notificationTime is set but reminderTime exists, use 1 hour before logic
  if (!reminder.notificationTime && reminder.reminderTime) {
    const reminderDateTime = new Date(reminder.reminderTime);
    const dueDate = new Date(reminder.dueDate);
    
    // For recurring reminders, check if today matches the pattern and it's 1 hour before
    if (reminder.isRecurring) {
      const daysToDue = daysBetween(now, dueDate);
      
      // Check if today is a recurring day
      if (daysToDue === 0) {
        return isAdvanceNotificationTime(reminderDateTime, now, false); // Use 1-hour-before logic
      }
      
      // For recurring reminders, also check if it's a regular occurrence
      const daysSinceStart = Math.abs(daysBetween(dueDate, now));
      const interval = reminder.recurrenceInterval ?? 1;
      
      switch (reminder.recurrenceType) {
        case "DAILY":
          if (daysSinceStart % interval === 0) {
            return isAdvanceNotificationTime(reminderDateTime, now, false);
          }
          break;
        case "WEEKLY":
          if (daysSinceStart % (7 * interval) === 0) {
            return isAdvanceNotificationTime(reminderDateTime, now, false);
          }
          break;
        case "MONTHLY":
          // For monthly, check if it's the same day of month
          if (now.getDate() === dueDate.getDate()) {
            return isAdvanceNotificationTime(reminderDateTime, now, false);
          }
          break;
      }
    } else {
      // For non-recurring reminders, check if it's 1 hour before reminder time
      return isAdvanceNotificationTime(reminderDateTime, now, false);
    }
  }
  
  return false;
}

export async function processRecurringReminders() {
  console.log('Starting recurring reminders processing...');
  
  try {
    // Get all reminders that are not completed and have notificationTime, reminderTime, or are recurring
    const reminders = await db.reminder.findMany({
      where: {
        isCompleted: false,
        OR: [
          { isRecurring: true },
          { reminderTime: { not: null } },
          { notificationTime: { not: null } }
        ]
      },
      include: {
        user: true // Include user details to get email
      }
    });

    console.log(`Found ${reminders.length} reminders to process`);
    const now = new Date();

    for (const reminder of reminders) {
      if (!reminder.dueDate || !reminder.user?.email) {
        console.log(`Skipping reminder "${reminder.title}" - missing due date or user email`);
        continue;
      }
      
      const dueDate = new Date(reminder.dueDate);
      const daysToDue = daysBetween(now, dueDate);

      console.log(`Processing reminder "${reminder.title}" - Days to due: ${daysToDue}, Has notificationTime: ${!!reminder.notificationTime}, NotificationTime: ${reminder.notificationTime?.toISOString()}, Current time: ${now.toISOString()}`);

      // 1. Check for advance notification (at user-set notification time)  
      if (reminder.notificationTime && shouldSendAdvanceNotification(reminder as ReminderData, now)) {
        console.log(`✅ Sending advance notification for "${reminder.title}" at user-set time ${new Date(reminder.notificationTime).toISOString()}`);
        
        try {
          await sendReminderNotification({
            type: "reminder-due-soon",
            reminderTitle: reminder.title,
            userEmail: reminder.user.email || '',
            userName: reminder.user.name ?? undefined,
            dueDate: dueDate,
            reminderTime: reminder.reminderTime ? new Date(reminder.reminderTime) : dueDate,
            description: reminder.description ?? undefined,
            priority: reminder.priority
          });
          console.log(`✅ Advance notification sent for "${reminder.title}"`);
          
          // Update the lastNotificationSent timestamp to prevent duplicate notifications
          await db.reminder.update({
            where: { id: reminder.id },
            data: { lastNotificationSent: now }
          });
          console.log(`Updated lastNotificationSent for "${reminder.title}"`);
        } catch (error) {
          console.error(`❌ Failed to send advance notification for "${reminder.title}":`, error);
        }
      } else if (reminder.notificationTime) {
        const notificationTime = new Date(reminder.notificationTime);
        const timeDiff = Math.abs(notificationTime.getTime() - now.getTime());
        console.log(`⏳ Advance notification not triggered for "${reminder.title}" - Time diff: ${Math.round(timeDiff/1000/60)} minutes`);
      }

      // 2. Check for exact reminder time notifications  
      if (reminder.reminderTime && shouldSendReminderNow(reminder as ReminderData, now)) {
        console.log(`Sending exact time notification for "${reminder.title}" at ${new Date(reminder.reminderTime).toLocaleTimeString()}`);
        
        try {
          await sendReminderNotification({
            type: "reminder-time",
            reminderTitle: reminder.title,
            userEmail: reminder.user.email || '',
            userName: reminder.user.name ?? undefined,
            dueDate: dueDate,
            reminderTime: reminder.reminderTime,
            description: reminder.description ?? undefined,
            priority: reminder.priority
          });
          console.log(`✅ Exact time notification sent for "${reminder.title}"`);
        } catch (error) {
          console.error(`❌ Failed to send exact time notification for "${reminder.title}":`, error);
        }
      }

      // 3. Check if today matches any pre-due notification interval
      if (Array.isArray(reminder.preDueNotifications) && reminder.preDueNotifications.includes(daysToDue)) {
        console.log(`Sending pre-due notification for "${reminder.title}" (${daysToDue} days before due)`);
        
        try {
          await sendReminderNotification({
            type: "pre-due",
            reminderTitle: reminder.title,
            userEmail: reminder.user.email,
            userName: reminder.user.name ?? undefined,
            dueDate: dueDate
          });
          console.log(`✅ Pre-due notification sent for "${reminder.title}"`);
        } catch (error) {
          console.error(`❌ Failed to send pre-due notification for "${reminder.title}":`, error);
        }
      }

      // Handle recurrence (create next occurrence when due date is reached)
      if (reminder.isRecurring && daysToDue === 0 && reminder.recurrenceType) {
        console.log(`Creating next occurrence for recurring reminder "${reminder.title}"`);
        
        // On due date, create next occurrence
        const nextDueDate = new Date(dueDate);
        const interval = reminder.recurrenceInterval ?? 1;
        
        switch (reminder.recurrenceType) {
          case "DAILY":
            nextDueDate.setDate(nextDueDate.getDate() + interval);
            break;
          case "WEEKLY":
            nextDueDate.setDate(nextDueDate.getDate() + 7 * interval);
            break;
          case "MONTHLY":
            nextDueDate.setMonth(nextDueDate.getMonth() + interval);
            break;
          case "CUSTOM":
            // Custom logic would go here - for now skip
            console.log(`Skipping CUSTOM recurrence for "${reminder.title}"`);
            continue;
          default:
            console.log(`Unknown recurrence type: ${String(reminder.recurrenceType) || 'undefined'}`);
            continue;
        }
        
        try {
          // Create new reminder with proper data structure
          await db.reminder.create({
            data: {
              userId: reminder.userId,
              title: reminder.title,
              description: reminder.description,
              dueDate: nextDueDate,
              priority: reminder.priority,
              category: reminder.category,
              isRecurring: reminder.isRecurring,
              recurrenceType: reminder.recurrenceType,
              recurrenceInterval: reminder.recurrenceInterval,
              preDueNotifications: reminder.preDueNotifications,
              isCompleted: false,
              emailNotification: reminder.emailNotification,
              pushNotification: reminder.pushNotification,
              isShared: false // New reminders start as non-shared
            }
          });
          console.log(`✅ Created next occurrence for "${reminder.title}" due ${nextDueDate.toDateString()}`);
        } catch (error) {
          console.error(`❌ Failed to create next occurrence for "${reminder.title}":`, error);
        }
      }
    }
    
    console.log('Recurring reminders processing completed');
  } catch (error) {
    console.error('❌ Error processing recurring reminders:', error);
    throw error;
  }
}

// For manual testing
if (import.meta.url === `file://${process.argv[1]}`) {
  void processRecurringReminders().then(() => {
    console.log("Processed recurring reminders.");
    process.exit(0);
  }).catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
}
