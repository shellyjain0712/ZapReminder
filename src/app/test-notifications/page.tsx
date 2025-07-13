'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { sendOverduePushNotification, requestNotificationPermission, formatOverdueTime } from '@/lib/overdue-notifications';

export default function NotificationTestPage() {
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    
    if (granted) {
      toast.success('Notification permission granted!');
    } else {
      toast.error('Notification permission denied');
    }
  };

  const handleTestOverdueNotification = async () => {
    const testReminder = {
      id: 'test-123',
      title: 'Test Overdue Reminder',
      description: 'This is a test notification for overdue functionality',
      dueDate: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      reminderTime: new Date(Date.now() - 30 * 60 * 1000),
      priority: 'HIGH' as const,
      minutesOverdue: 30
    };

    const success = await sendOverduePushNotification(testReminder);
    
    if (success) {
      toast.success('Test overdue notification sent!');
      setTestSent(true);
    } else {
      toast.error('Failed to send notification');
    }
  };

  const handleTestUrgentNotification = async () => {
    const urgentReminder = {
      id: 'urgent-456',
      title: 'URGENT: Important Meeting!',
      description: 'Critical meeting that was missed',
      dueDate: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      reminderTime: new Date(Date.now() - 60 * 60 * 1000),
      priority: 'URGENT' as const,
      minutesOverdue: 60
    };

    const success = await sendOverduePushNotification(urgentReminder);
    
    if (success) {
      toast.success('Test urgent notification sent!');
    } else {
      toast.error('Failed to send urgent notification');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">🚨 Overdue Notification Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permission Status */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Notification Permission:</span>
            <Badge variant={notificationPermission === 'granted' ? 'default' : 'destructive'}>
              {notificationPermission.toUpperCase()}
            </Badge>
          </div>

          {/* Request Permission */}
          {notificationPermission !== 'granted' && (
            <Button onClick={handleRequestPermission} className="w-full">
              🔔 Request Notification Permission
            </Button>
          )}

          {/* Test Notifications */}
          {notificationPermission === 'granted' && (
            <div className="space-y-4">
              <h3 className="font-semibold">Test Overdue Notifications:</h3>
              
              <Button 
                onClick={handleTestOverdueNotification} 
                className="w-full"
                variant="outline"
              >
                📝 Test Normal Overdue (30 min ago)
              </Button>
              
              <Button 
                onClick={handleTestUrgentNotification} 
                className="w-full"
                variant="destructive"
              >
                🚨 Test Urgent Overdue (1 hour ago)
              </Button>
              
              {testSent && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-700 text-sm">
                    ✅ Test notification sent! Check your browser notifications.
                    <br />
                    <span className="text-xs text-green-600">
                      Note: Urgent notifications stay visible until you interact with them.
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Information */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-semibold text-blue-800 mb-2">How Overdue Notifications Work:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Automatically checks for overdue reminders every 2 minutes</li>
              <li>• Sends push notifications for reminders past their set time</li>
              <li>• URGENT reminders stay visible until you interact with them</li>
              <li>• Normal reminders auto-close after 10 seconds</li>
              <li>• Click notification to go to dashboard</li>
              <li>• White clock icons indicate specific times are set</li>
            </ul>
          </div>

          {/* Format Examples */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h4 className="font-semibold text-gray-800 mb-2">Overdue Time Examples:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• {formatOverdueTime(5)} - Recently overdue</p>
              <p>• {formatOverdueTime(30)} - Half hour late</p>
              <p>• {formatOverdueTime(120)} - Two hours late</p>
              <p>• {formatOverdueTime(1500)} - Over a day late</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
