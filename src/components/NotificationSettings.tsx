'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff } from 'lucide-react';
import { notificationService } from '@/lib/notification-service';

export function NotificationSettings() {
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'default'>('default');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    setIsRequesting(true);
    try {
      const permission = await notificationService.requestPermission();
      setNotificationStatus(permission);
      
      if (permission === 'granted') {
        // Show a test notification
        await notificationService.showNotification({
          title: '🔔 Notifications Enabled!',
          body: 'You\'ll now receive reminder notifications.',
        });
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusInfo = () => {
    switch (notificationStatus) {
      case 'granted':
        return {
          badge: <Badge className="bg-green-500 text-white"><Bell className="h-3 w-3 mr-1" />Enabled</Badge>,
          description: 'You\'ll receive notifications for due reminders.',
        };
      case 'denied':
        return {
          badge: <Badge variant="destructive"><BellOff className="h-3 w-3 mr-1" />Blocked</Badge>,
          description: 'Notifications are blocked. Enable them in your browser settings.',
        };
      default:
        return {
          badge: <Badge variant="outline"><Bell className="h-3 w-3 mr-1" />Not set</Badge>,
          description: 'Click to enable notifications for reminders.',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Notifications:</span>
          {statusInfo.badge}
        </div>
        <p className="text-xs text-muted-foreground">{statusInfo.description}</p>
      </div>
      
      {notificationStatus !== 'granted' && notificationStatus !== 'denied' && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={requestPermission}
          disabled={isRequesting}
        >
          <Bell className="h-4 w-4 mr-2" />
          {isRequesting ? 'Requesting...' : 'Enable'}
        </Button>
      )}
    </div>
  );
}
