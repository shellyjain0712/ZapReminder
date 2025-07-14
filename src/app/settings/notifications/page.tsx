'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/use-settings';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Clock, 
  Settings,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function NotificationsSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { settings, updateSetting } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  
  // Notification preferences are now managed by the settings hook
  
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    // Check push notification support
    if ('Notification' in window) {
      setPushSupported(true);
      setPushEnabled(Notification.permission === 'granted');
    }
  }, [session, status, router]);

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications are not supported in this browser');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        toast.success('Push notifications enabled');
      } else if (permission === 'denied') {
        toast.error('Push notifications denied. Please enable them in your browser settings.');
      }
    } catch {
      toast.error('Failed to request notification permission');
    }
  };

  const updateNotificationSettings = async (key: keyof typeof settings, value: boolean | string) => {
    setIsLoading(true);
    try {
      const success = await updateSetting(key, value);
      if (success) {
        toast.success('Notification settings updated');
      }
    } catch {
      toast.error('Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = () => {
    if (!pushEnabled) {
      toast.error('Push notifications are not enabled');
      return;
    }

    new Notification('Test Notification', {
      body: 'This is a test notification from Task Reminder App',
      icon: '/favicon.ico'
    });
    
    toast.success('Test notification sent');
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground">
          Manage how and when you want to receive notifications about your reminders.
        </p>
      </div>

      {/* Notification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Status
          </CardTitle>
          <CardDescription>
            Current status of your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium text-sm">Email Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {settings.emailReminders ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              {settings.emailReminders && (
                <Badge variant="secondary" className="ml-auto">Active</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Smartphone className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium text-sm">Push Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {pushEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              {pushEnabled && (
                <Badge variant="secondary" className="ml-auto">Active</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get instant notifications on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Push notifications are not supported in this browser.
              </AlertDescription>
            </Alert>
          ) : !pushEnabled ? (
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <p className="font-medium">Push notifications are disabled</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Enable push notifications to get instant reminders on your device.
              </p>
              <Button onClick={requestPushPermission}>
                Enable Push Notifications
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  Push notifications are enabled and working
                </p>
                <Button variant="outline" size="sm" onClick={testNotification} className="ml-auto">
                  Test
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Reminder Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when reminders are due
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushReminders}
                    onCheckedChange={(value) => void updateNotificationSettings('pushReminders', value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Instant Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get immediate notifications for urgent reminders
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushInstant}
                    onCheckedChange={(value) => void updateNotificationSettings('pushInstant', value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications via email to {session.user?.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Reminder Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Get email reminders for your tasks
                </p>
              </div>
              <Switch
                checked={settings.emailReminders}
                onCheckedChange={(value) => void updateNotificationSettings('emailReminders', value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Weekly Digest</Label>
                <p className="text-sm text-muted-foreground">
                  Weekly summary of your completed and pending tasks
                </p>
              </div>
              <Switch
                checked={settings.emailWeeklyDigest}
                onCheckedChange={(value) => void updateNotificationSettings('emailWeeklyDigest', value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Security Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Important security notifications about your account
                </p>
              </div>
              <Switch
                checked={settings.emailSecurityAlerts}
                onCheckedChange={(value) => void updateNotificationSettings('emailSecurityAlerts', value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Product Updates</Label>
                <p className="text-sm text-muted-foreground">
                  News about new features and updates
                </p>
              </div>
              <Switch
                checked={settings.emailProductUpdates}
                onCheckedChange={(value) => void updateNotificationSettings('emailProductUpdates', value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Reminder Settings
          </CardTitle>
          <CardDescription>
            Customize how and when you receive reminder notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Reminder Time</Label>
              <Select 
                value={settings.reminderTiming} 
                onValueChange={(value) => void updateNotificationSettings('reminderTiming', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">At time of event</SelectItem>
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="1440">1 day before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reminder Frequency</Label>
              <Select 
                value={settings.reminderFrequency} 
                onValueChange={(value) => void updateNotificationSettings('reminderFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.reminderSound ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              <div>
                <Label className="font-medium">Notification Sound</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound with notifications
                </p>
              </div>
            </div>
            <Switch
              checked={settings.reminderSound}
              onCheckedChange={(value) => void updateNotificationSettings('reminderSound', value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Set times when you don&apos;t want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">
                Disable notifications during specified hours
              </p>
            </div>
            <Switch
              checked={settings.quietHours}
              onCheckedChange={(value) => void updateNotificationSettings('quietHours', value)}
              disabled={isLoading}
            />
          </div>

          {settings.quietHours && (
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select 
                  value={settings.quietStart} 
                  onValueChange={(value) => void updateNotificationSettings('quietStart', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={i} value={`${hour}:00`}>
                          {`${hour}:00`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Select 
                  value={settings.quietEnd} 
                  onValueChange={(value) => void updateNotificationSettings('quietEnd', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={i} value={`${hour}:00`}>
                          {`${hour}:00`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Weekend Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications on weekends
              </p>
            </div>
            <Switch
              checked={settings.weekendNotifications}
              onCheckedChange={(value) => void updateNotificationSettings('weekendNotifications', value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
