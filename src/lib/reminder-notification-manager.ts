/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
'use client';

import { notificationService } from './notification-service';

interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  isCompleted: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  emailNotification: boolean;
  pushNotification: boolean;
  reminderTime?: Date;
  notificationTime?: Date; // When to send advance notification email
  isSnooze: boolean;
  snoozeUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class ReminderNotificationManager {
  private static instance: ReminderNotificationManager;
  private checkInterval: number | null = null;
  private lastCheckedTime: Date = new Date();
  private notifiedOverdueIds = new Set<string>();
  private notifiedReminderIds = new Set<string>();

  constructor() {
    // Initialize with current time to avoid immediate notifications on first load
    this.lastCheckedTime = new Date();
  }

  static getInstance(): ReminderNotificationManager {
    if (!ReminderNotificationManager.instance) {
      ReminderNotificationManager.instance = new ReminderNotificationManager();
    }
    return ReminderNotificationManager.instance;
  }

  async start(): Promise<void> {
    // Request notification permission on start
    await notificationService.requestPermission();
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every minute for due reminders
    this.checkInterval = setInterval(() => {
      void this.checkReminders();
    }, 60000) as unknown as number; // 1 minute

    // Also check immediately
    void this.checkReminders();
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async fetchReminders(): Promise<Reminder[]> {
    try {
      const response = await fetch('/api/reminders');
      if (!response.ok) {
        return [];
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await response.json() as any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((reminder: any) => ({
        ...reminder,
        dueDate: new Date(reminder.dueDate as string),
        reminderTime: reminder.reminderTime ? new Date(reminder.reminderTime as string) : undefined,
        snoozeUntil: reminder.snoozeUntil ? new Date(reminder.snoozeUntil as string) : undefined,
        createdAt: new Date(reminder.createdAt as string),
        updatedAt: new Date(reminder.updatedAt as string),
        isCompleted: (reminder.completed as boolean) ?? false,
      })) as Reminder[];
    } catch (error) {
      console.error('Failed to fetch reminders for notifications:', error);
      return [];
    }
  }

  private async checkReminders(): Promise<void> {
    const reminders = await this.fetchReminders();
    const now = new Date();

    for (const reminder of reminders) {
      if (reminder.isCompleted || !reminder.pushNotification) {
        continue;
      }

      // Check for overdue reminders
      if (this.isOverdue(reminder, now) && !this.notifiedOverdueIds.has(reminder.id)) {
        await notificationService.showOverdueReminder(reminder);
        this.notifiedOverdueIds.add(reminder.id);
      }

      // Check for reminders that are due now
      if (this.isDueNow(reminder, now) && reminder.reminderTime && !this.notifiedReminderIds.has(reminder.id)) {
        await notificationService.showUpcomingReminder({
          id: reminder.id,
          title: reminder.title,
          description: reminder.description,
          reminderTime: reminder.reminderTime,
        });
        this.notifiedReminderIds.add(reminder.id);
      }
    }

    this.lastCheckedTime = now;
  }

  private isOverdue(reminder: Reminder, now: Date): boolean {
    // If reminder is snoozed, check against snooze time
    if (reminder.isSnooze && reminder.snoozeUntil) {
      return reminder.snoozeUntil < now;
    }
    
    // Otherwise check against reminder time or due date
    const checkTime = reminder.reminderTime ?? reminder.dueDate;
    return checkTime < now;
  }

  private isDueNow(reminder: Reminder, now: Date): boolean {
    if (!reminder.reminderTime) {
      return false;
    }

    // Check if reminder time is within the last minute
    const timeDiff = Math.abs(now.getTime() - reminder.reminderTime.getTime());
    const oneMinute = 60 * 1000;
    
    return timeDiff <= oneMinute && reminder.reminderTime <= now;
  }

  // Clear notification flags when reminder is completed or deleted
  clearNotificationFlags(reminderId: string): void {
    this.notifiedOverdueIds.delete(reminderId);
    this.notifiedReminderIds.delete(reminderId);
  }

  // Clear all notification flags (useful for testing or reset)
  clearAllNotificationFlags(): void {
    this.notifiedOverdueIds.clear();
    this.notifiedReminderIds.clear();
  }
}

export const reminderNotificationManager = ReminderNotificationManager.getInstance();
