'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export function NotificationSettings() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPushSupported(true);
      setPermission(Notification.permission);
      const enabled = localStorage.getItem('pushNotifications') === 'true';
      setPushEnabled(enabled && Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      setIsLoading(true);
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === 'granted') {
          setPushEnabled(true);
          localStorage.setItem('pushNotifications', 'true');
          toast.success('Push notifications enabled!');
        } else {
          toast.error('Push notifications denied');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        toast.error('Failed to request permission');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const testNotification = () => {
    if (pushEnabled && 'Notification' in window) {
      new Notification('ZapReminder Test', {
        body: 'Your notifications are working perfectly! 🎉',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });
      toast.success('Test notification sent');
    }
  };

  const togglePushNotifications = (enabled: boolean) => {
    setPushEnabled(enabled);
    localStorage.setItem('pushNotifications', enabled.toString());
    toast.success(enabled ? 'Push notifications enabled' : 'Push notifications disabled');
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5" />
          Quick Notification Settings
        </CardTitle>
        <CardDescription>
          Manage your notification preferences quickly from the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pushSupported ? (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="push-notifications" className="font-medium text-sm">
                Browser Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Get notified when reminders are due
              </p>
            </div>
            <div className="flex items-center gap-3">
              {permission === 'denied' && (
                <Badge variant="destructive" className="text-xs">
                  Blocked
                </Badge>
              )}
              {permission === 'granted' && pushEnabled && (
                <Badge variant="default" className="text-xs bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
              {permission === 'granted' ? (
                <div className="flex items-center gap-2">
                  <Switch
                    id="push-notifications"
                    checked={pushEnabled}
                    onCheckedChange={togglePushNotifications}
                    disabled={isLoading}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={testNotification}
                    className="h-8 px-3 text-xs"
                  >
                    Test
                  </Button>
                </div>
              ) : (
                <Button 
                  size="sm" 
                  onClick={requestPermission}
                  disabled={isLoading}
                  className="h-8 px-3 text-xs"
                >
                  {isLoading ? 'Requesting...' : 'Enable'}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Push notifications not supported in this browser
            </p>
          </div>
        )}

        {permission === 'denied' && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Notifications are blocked. Please enable them in your browser settings and refresh the page.
            </p>
          </div>
        )}
        
        <div className="pt-2 border-t">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Advanced Settings
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
