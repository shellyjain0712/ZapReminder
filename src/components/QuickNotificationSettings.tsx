'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export function NotificationSettings() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPushSupported(true);
      setPermission(Notification.permission);
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        setPushEnabled(true);
        toast.success('Push notifications enabled!');
      } else {
        toast.error('Push notifications denied');
      }
    }
  };

  const testNotification = () => {
    if (pushEnabled && 'Notification' in window) {
      new Notification('ZapReminder Test', {
        body: 'Push notifications are working correctly!',
        icon: '/favicon.ico'
      });
      toast.success('Test notification sent');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Quick Notification Settings
        </CardTitle>
        <CardDescription>
          Manage your basic notification preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pushSupported ? (
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Browser notifications for reminders
              </p>
            </div>
            <div className="flex items-center gap-2">
              {permission === 'denied' && (
                <Badge variant="destructive">Blocked</Badge>
              )}
              {permission === 'granted' ? (
                <div className="flex items-center gap-2">
                  <Switch
                    id="push-notifications"
                    checked={pushEnabled}
                    onCheckedChange={setPushEnabled}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={testNotification}
                  >
                    Test
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={requestPermission}>
                  Enable
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Push notifications not supported in this browser
          </div>
        )}
        
        <div className="pt-2 border-t">
          <Link href="/settings">
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              More Settings
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
