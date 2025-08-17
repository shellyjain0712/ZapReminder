import { toast } from 'sonner';

export interface OverdueReminderData {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  reminderTime?: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  minutesOverdue: number;
}

interface ReminderData {
  id: string;
  title: string;
  description?: string;
  dueDate: string | Date;
  reminderTime?: string | Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isCompleted: boolean;
  isSnooze: boolean;
  snoozeUntil?: string | Date;
}

// Check if reminder is overdue
export function checkForOverdueReminders(reminders: ReminderData[]): OverdueReminderData[] {
  const now = new Date();
  const overdueReminders: OverdueReminderData[] = [];

  for (const reminder of reminders) {
    if (reminder.isCompleted) continue;

    // Determine check time - use snooze time if snoozed, otherwise reminder time or due date
    let checkTime: Date;
    if (reminder.isSnooze && reminder.snoozeUntil) {
      checkTime = new Date(reminder.snoozeUntil);
    } else {
      checkTime = reminder.reminderTime ? new Date(reminder.reminderTime) : new Date(reminder.dueDate);
    }

    if (checkTime < now) {
      const minutesOverdue = Math.floor((now.getTime() - checkTime.getTime()) / (1000 * 60));
      
      overdueReminders.push({
        id: reminder.id,
        title: reminder.title,
        description: reminder.description,
        dueDate: new Date(reminder.dueDate),
        reminderTime: reminder.reminderTime ? new Date(reminder.reminderTime) : undefined,
        priority: reminder.priority,
        minutesOverdue
      });
    }
  }

  return overdueReminders;
}

// Format overdue time for display
export function formatOverdueTime(minutesOverdue: number): string {
  if (minutesOverdue < 60) {
    return `${minutesOverdue} minute${minutesOverdue !== 1 ? 's' : ''} ago`;
  }
  
  const hoursOverdue = Math.floor(minutesOverdue / 60);
  if (hoursOverdue < 24) {
    return `${hoursOverdue} hour${hoursOverdue !== 1 ? 's' : ''} ago`;
  }
  
  const daysOverdue = Math.floor(hoursOverdue / 24);
  return `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago`;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      toast.success('Notifications enabled! You\'ll receive overdue reminders.');
      return true;
    } else {
      console.warn('Notification permission not granted');
      toast.info('Enable notifications to receive overdue alerts');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

export async function sendOverduePushNotification(reminder: OverdueReminderData): Promise<boolean> {
  const hasPermission = await requestNotificationPermission();
  
  if (!hasPermission) {
    console.warn('No notification permission');
    return false;
  }

  try {
    // Use simple browser notification without actions
    const notification = new Notification(`⏰ Overdue: ${reminder.title}`, {
      body: `This reminder was due ${formatOverdueTime(reminder.minutesOverdue)}. Click to view in dashboard.`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `overdue-${reminder.id}`, // Prevents duplicate notifications
      requireInteraction: true, // Keeps notification visible until user interacts
    });

    // Handle notification clicks
    notification.onclick = () => {
      window.focus();
      // Navigate to dashboard or specific reminder
      window.location.href = '/dashboard';
      notification.close();
    };

    // Auto-close after 15 seconds for non-urgent reminders
    if (reminder.priority !== 'URGENT') {
      setTimeout(() => {
        notification.close();
      }, 15000);
    }

    console.log(`📱 Overdue notification sent: ${reminder.title}`);
    return true;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
}

// Global flag to prevent multiple monitoring instances
let globalMonitoringInterval: NodeJS.Timeout | null = null;

// Real-time overdue monitoring - checks every second for instant notifications
export function startRealTimeOverdueMonitoring(
  fetchReminders: () => Promise<unknown[]>
) {
  // Prevent multiple instances
  if (globalMonitoringInterval) {
    console.log('🔄 Real-time monitoring already active, skipping...');
    return () => {
      // Cleanup function - no additional cleanup needed since we already cleared interval
    };
  }

  const notifiedReminders = new Set<string>(); // Track which reminders we've already notified about
  let lastCheckTime = new Date();

  const checkForInstantOverdue = async () => {
    try {
      const currentTime = new Date();
      const reminders = await fetchReminders();
      
      for (const reminderData of reminders) {
        // Type guard to ensure reminder has required properties
        const reminder = reminderData as ReminderData;
        if (!reminder || typeof reminder !== 'object') continue;
        
        // Skip completed reminders
        if (reminder.isCompleted) continue;

        // Determine check time (snooze time if snoozed, otherwise reminder time or due date)
        let checkTime: Date;
        if (reminder.isSnooze && reminder.snoozeUntil) {
          checkTime = new Date(reminder.snoozeUntil);
        } else {
          checkTime = reminder.reminderTime ? new Date(reminder.reminderTime) : new Date(reminder.dueDate);
        }
        
        // Check if was overdue before this check
        const wasOverdueBefore = checkTime <= lastCheckTime;
        const isOverdueNow = checkTime <= currentTime;
        
        // If reminder just became overdue AND we haven't notified about it yet
        if (!wasOverdueBefore && isOverdueNow && !notifiedReminders.has(reminder.id)) {
          console.log(`🚨 INSTANT OVERDUE: ${reminder.title} - sending notification NOW!`);
          
          const minutesOverdue = Math.floor((currentTime.getTime() - checkTime.getTime()) / (1000 * 60));
          
          const overdueData: OverdueReminderData = {
            id: reminder.id,
            title: reminder.title,
            description: reminder.description,
            dueDate: new Date(reminder.dueDate),
            reminderTime: reminder.reminderTime ? new Date(reminder.reminderTime) : undefined,
            priority: reminder.priority,
            minutesOverdue: Math.max(0, minutesOverdue) // Ensure it's at least 0
          };

          // Send instant notification
          const notificationSent = await sendOverduePushNotification(overdueData);
          
          if (notificationSent) {
            notifiedReminders.add(reminder.id);
            console.log(`✅ Instant notification sent for: ${reminder.title}`);
          }
        }
        
        // Clean up notifications for completed reminders
        if (reminder.isCompleted && notifiedReminders.has(reminder.id)) {
          notifiedReminders.delete(reminder.id);
        }
      }
      
      lastCheckTime = currentTime;
    } catch (error) {
      console.error('Error in real-time overdue check:', error);
    }
  };

  // Check every second for instant notifications!
  console.log('🔥 Starting REAL-TIME overdue monitoring (checking every second)');
  globalMonitoringInterval = setInterval(() => {
    void checkForInstantOverdue();
  }, 1000); // 1 second intervals
  
  // Run immediately
  void checkForInstantOverdue();
  
  // Return cleanup function
  return () => {
    console.log('⏹️ Stopping real-time overdue monitoring');
    if (globalMonitoringInterval) {
      clearInterval(globalMonitoringInterval);
      globalMonitoringInterval = null;
    }
  };
}

// Background check for overdue reminders (less frequent for existing overdue items)
export function startOverdueReminderMonitoring(
  fetchReminders: () => Promise<ReminderData[]>,
  intervalMinutes = 5
) {
  const checkOverdue = async () => {
    try {
      const reminders = await fetchReminders();
      const overdueReminders = checkForOverdueReminders(reminders);
      
      for (const overdue of overdueReminders) {
        // Only send notification if reminder just became overdue (within the last interval)
        if (overdue.minutesOverdue <= intervalMinutes) {
          console.log(`🚨 Sending overdue notification for: ${overdue.title}`);
          await sendOverduePushNotification(overdue);
        }
      }
    } catch (error) {
      console.error('Error checking for overdue reminders:', error);
    }
  };

  // Run immediately and then at intervals
  void checkOverdue();
  
  const interval = setInterval(() => {
    void checkOverdue();
  }, intervalMinutes * 60 * 1000);
  
  // Return cleanup function
  return () => clearInterval(interval);
}
