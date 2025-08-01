'use client';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined') {
      this.permission = Notification.permission;
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission;
  }

  async showNotification(options: NotificationOptions): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (this.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return false;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon ?? '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction ?? false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }

  async showOverdueReminder(reminder: {
    id: string;
    title: string;
    description?: string;
    dueDate: Date;
  }): Promise<boolean> {
    return this.showNotification({
      title: '⚠️ Overdue Reminder',
      body: `"${reminder.title}" was due on ${reminder.dueDate.toLocaleDateString()}`,
      tag: `overdue-${reminder.id}`,
      requireInteraction: true,
    });
  }

  async showUpcomingReminder(reminder: {
    id: string;
    title: string;
    description?: string;
    reminderTime: Date;
  }): Promise<boolean> {
    return this.showNotification({
      title: '🔔 Reminder Alert',
      body: `"${reminder.title}" is due now!`,
      tag: `reminder-${reminder.id}`,
      requireInteraction: true,
    });
  }
}

export const notificationService = NotificationService.getInstance();
