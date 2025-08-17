'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  User, 
  Bell, 
  Palette, 
  Shield,
  Download,
  Moon,
  Sun,
  Smartphone,
  Database,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface SettingsData {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  reminderFrequency: string;
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  weekStartsOn: string;
  emailDigest: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
  autoSnooze: boolean;
  defaultReminderTime: string;
  calendarSync: boolean;
  compactView: boolean;
  animationsEnabled: boolean;
  highContrast: boolean;
}

interface UserStats {
  totalReminders: number;
  completedReminders: number;
  overdueReminders: number;
  streakDays: number;
  joinDate: string;
  storageUsed: number;
}

export function SimpleSettings() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<SettingsData>({
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    reminderFrequency: 'immediate',
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/dd/yyyy',
    weekStartsOn: 'monday',
    emailDigest: true,
    marketingEmails: false,
    securityAlerts: true,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00',
    autoSnooze: false,
    defaultReminderTime: '09:00',
    calendarSync: false,
    compactView: false,
    animationsEnabled: true,
    highContrast: false
  });
  
  const [userStats, setUserStats] = useState<UserStats>({
    totalReminders: 0,
    completedReminders: 0,
    overdueReminders: 0,
    streakDays: 0,
    joinDate: '',
    storageUsed: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [activeTab, setActiveTab] = useState('account');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadUserStats = useCallback(async () => {
    try {
      const response = await fetch('/api/reminders');
      if (response.ok) {
        const reminders = await response.json() as Array<{
          id: string;
          isCompleted: boolean;
          dueDate: string;
          createdAt: string;
        }>;
        
        const now = new Date();
        const completed = reminders.filter(r => r.isCompleted).length;
        const overdue = reminders.filter(r => 
          !r.isCompleted && new Date(r.dueDate) < now
        ).length;
        
        // Calculate join date from oldest reminder or session creation
        const oldestReminder = reminders.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[0];
        
        // Calculate streak (simplified - days with completed reminders in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCompletions = reminders.filter(r => 
          r.isCompleted && new Date(r.createdAt) > thirtyDaysAgo
        );
        const streak = Math.min(recentCompletions.length, 30);
        
        setUserStats({
          totalReminders: reminders.length,
          completedReminders: completed,
          overdueReminders: overdue,
          streakDays: streak,
          joinDate: oldestReminder?.createdAt ?? session?.user?.email ? new Date().toISOString() : new Date().toISOString(),
          storageUsed: Math.floor(JSON.stringify(reminders).length / 1024) // KB
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      // Set default stats if API fails
      setUserStats({
        totalReminders: 0,
        completedReminders: 0,
        overdueReminders: 0,
        streakDays: 0,
        joinDate: session?.user?.email ? new Date().toISOString() : new Date().toISOString(),
        storageUsed: 0
      });
    }
  }, [session?.user?.email]);

  useEffect(() => {
    // Check push notification permission
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('zapreminder-settings');
    console.log('Loading settings from localStorage:', savedSettings);
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as Partial<SettingsData>;
        console.log('Parsed settings:', parsed);
        setSettings(prev => {
          const updated = { ...prev, ...parsed };
          console.log('Updated settings state:', updated);
          return updated;
        });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    } else {
      console.log('No saved settings found, using defaults');
    }

    // Load user stats
    void loadUserStats();
  }, [loadUserStats]);

  // Separate useEffect for session-dependent operations
  useEffect(() => {
    if (session) {
      void loadUserStats();
    }
  }, [session, loadUserStats]);

  const saveSettings = async (newSettings: Partial<SettingsData>) => {
    console.log('Saving settings:', newSettings);
    setIsLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      console.log('Updated settings:', updatedSettings);
      
      // Update state immediately
      setSettings(updatedSettings);
      
      // Save to localStorage immediately for quick response
      localStorage.setItem('zapreminder-settings', JSON.stringify(updatedSettings));
      console.log('Settings saved to localStorage');
      
      // Try to sync with server if logged in
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/user/settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedSettings),
          });
          
          if (response.ok) {
            console.log('Settings synced with server successfully');
          } else {
            console.warn('Failed to sync settings with server, but saved locally');
          }
        } catch (syncError) {
          console.warn('Server sync failed, settings saved locally:', syncError);
        }
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support notifications');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        await saveSettings({ pushNotifications: true });
        toast.success('Push notifications enabled');
        
        // Show a welcome notification
        setTimeout(() => {
          new Notification('ZapReminder Notifications Enabled! 🎉', {
            body: 'You\'ll now receive reminders and updates directly in your browser.',
            icon: '/favicon.ico',
            tag: 'welcome-notification'
          });
        }, 500);
      } else if (permission === 'denied') {
        toast.error('Push notifications denied. You can enable them in your browser settings.');
      } else {
        toast.info('Push notification permission was dismissed');
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
      toast.error('Failed to request notification permission');
    }
  };

  const testNotification = () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support notifications');
      return;
    }

    if (Notification.permission !== 'granted') {
      toast.error('Notifications not enabled. Please enable them first.');
      return;
    }

    try {
      const notification = new Notification('ZapReminder Test Notification 🔔', {
        body: 'This is a test notification from your settings. If you can see this, notifications are working perfectly!',
        icon: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: false
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      toast.success('Test notification sent successfully!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  const exportData = async () => {
    setIsLoading(true);
    try {
      // Fetch reminders data
      const reminderResponse = await fetch('/api/reminders');
      let reminders: unknown[] = [];
      
      if (reminderResponse.ok) {
        reminders = await reminderResponse.json() as unknown[];
      }

      // Create comprehensive export data
      const exportData = {
        exportInfo: {
          exportDate: new Date().toISOString(),
          version: '1.0.0',
          source: 'ZapReminder Settings'
        },
        user: {
          email: session?.user?.email,
          name: session?.user?.name,
          joinDate: userStats.joinDate
        },
        reminders,
        settings,
        statistics: userStats,
        metadata: {
          totalItems: reminders.length,
          settingsVersion: 1,
          browserInfo: navigator.userAgent
        }
      };
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zapreminder-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Data exported successfully! ${reminders.length} reminders included.`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = () => {
    const defaultSettings: SettingsData = {
      emailNotifications: true,
      pushNotifications: true,
      soundEnabled: true,
      reminderFrequency: 'immediate',
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/dd/yyyy',
      weekStartsOn: 'monday',
      emailDigest: true,
      marketingEmails: false,
      securityAlerts: true,
      quietHours: false,
      quietStart: '22:00',
      quietEnd: '08:00',
      autoSnooze: false,
      defaultReminderTime: '09:00',
      calendarSync: false,
      compactView: false,
      animationsEnabled: true,
      highContrast: false
    };

    localStorage.removeItem('zapreminder-settings');
    setSettings(defaultSettings);
    setActiveTab('account'); // Reset to first tab
    toast.success('Settings reset to defaults successfully!');
  };

  if (!session) return null;

  return (
    <div className="space-y-8">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account preferences and application settings
          </p>
        </div>
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Reminders</span>
              <span className="font-semibold">{userStats.totalReminders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="font-semibold text-green-600">{userStats.completedReminders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Storage Used</span>
              <span className="font-semibold">{userStats.storageUsed} KB</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Manage your personal information and account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Full Name</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{session.user?.name ?? 'Not set'}</p>
                    <Badge variant="outline">
                      {session.user?.image ? 'Google' : 'Email'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email Address</Label>
                  <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Member Since</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(userStats.joinDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Account Status</Label>
                  <Badge variant="secondary" className="w-fit">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Preferences</h4>
                
                {/* Debug section - remove this after testing */}
                <div className="p-3 bg-muted rounded-lg text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold mb-2">Current Settings (Debug):</p>
                      <div className="grid grid-cols-2 gap-2">
                        <span>Language: {settings.language}</span>
                        <span>Timezone: {settings.timezone}</span>
                        <span>Date Format: {settings.dateFormat}</span>
                        <span>Week Starts: {settings.weekStartsOn}</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        localStorage.removeItem('zapreminder-settings');
                        window.location.reload();
                      }}
                      className="text-xs"
                    >
                      Clear & Reload
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select 
                      value={settings.language} 
                      onValueChange={(value) => {
                        console.log('Language changed to:', value);
                        void saveSettings({ language: value });
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select 
                      value={settings.timezone} 
                      onValueChange={(value) => {
                        console.log('Timezone changed to:', value);
                        void saveSettings({ timezone: value });
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select 
                      value={settings.dateFormat} 
                      onValueChange={(value) => {
                        console.log('Date format changed to:', value);
                        void saveSettings({ dateFormat: value });
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Week Starts On</Label>
                    <Select 
                      value={settings.weekStartsOn} 
                      onValueChange={(value) => {
                        console.log('Week starts on changed to:', value);
                        void saveSettings({ weekStartsOn: value });
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sunday">Sunday</SelectItem>
                        <SelectItem value="monday">Monday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Push Notifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Browser notifications for reminders and updates
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pushPermission === 'denied' && (
                      <Badge variant="destructive">Blocked</Badge>
                    )}
                    {pushPermission === 'granted' ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={settings.pushNotifications}
                          onCheckedChange={(checked) => saveSettings({ pushNotifications: checked })}
                          disabled={isLoading}
                        />
                        <Button size="sm" variant="outline" onClick={testNotification}>
                          Test
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={requestPushPermission} disabled={isLoading}>
                        Enable
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders and updates via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => saveSettings({ emailNotifications: checked })}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Daily Email Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Get a summary of upcoming reminders each morning
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailDigest}
                    onCheckedChange={(checked) => saveSettings({ emailDigest: checked })}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Important security and account notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.securityAlerts}
                    onCheckedChange={(checked) => saveSettings({ securityAlerts: checked })}
                    disabled={isLoading}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Notification Sounds</Label>
                    <p className="text-sm text-muted-foreground">
                      Play sound when notifications arrive
                    </p>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => saveSettings({ soundEnabled: checked })}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Quiet Hours</Label>
                    <p className="text-sm text-muted-foreground">
                      Disable notifications during specified hours
                    </p>
                  </div>
                  <Switch
                    checked={settings.quietHours}
                    onCheckedChange={(checked) => saveSettings({ quietHours: checked })}
                    disabled={isLoading}
                  />
                </div>

                {settings.quietHours && (
                  <div className="grid grid-cols-2 gap-4 ml-4 pt-2">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={settings.quietStart}
                        onChange={(e) => saveSettings({ quietStart: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={settings.quietEnd}
                        onChange={(e) => saveSettings({ quietEnd: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Reminder Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Reminder Time</Label>
                    <Select
                      value={settings.reminderFrequency}
                      onValueChange={(value) => saveSettings({ reminderFrequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">At due time</SelectItem>
                        <SelectItem value="5min">5 minutes before</SelectItem>
                        <SelectItem value="15min">15 minutes before</SelectItem>
                        <SelectItem value="30min">30 minutes before</SelectItem>
                        <SelectItem value="1hour">1 hour before</SelectItem>
                        <SelectItem value="1day">1 day before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Time for New Reminders</Label>
                    <Input
                      type="time"
                      value={settings.defaultReminderTime}
                      onChange={(e) => saveSettings({ defaultReminderTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-snooze Overdue Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically snooze reminders that become overdue
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoSnooze}
                    onCheckedChange={(checked) => saveSettings({ autoSnooze: checked })}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Display & Interface
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light Mode
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark Mode
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          System Default
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Compact View</Label>
                    <p className="text-sm text-muted-foreground">
                      Use a more condensed layout to fit more content
                    </p>
                  </div>
                  <Switch
                    checked={settings.compactView}
                    onCheckedChange={(checked) => saveSettings({ compactView: checked })}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Animations</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable smooth transitions and animations
                    </p>
                  </div>
                  <Switch
                    checked={settings.animationsEnabled}
                    onCheckedChange={(checked) => saveSettings({ animationsEnabled: checked })}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>High Contrast</Label>
                    <p className="text-sm text-muted-foreground">
                      Increase contrast for better accessibility
                    </p>
                  </div>
                  <Switch
                    checked={settings.highContrast}
                    onCheckedChange={(checked) => saveSettings({ highContrast: checked })}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Calendar Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync reminders with your calendar
                    </p>
                  </div>
                  <Switch
                    checked={settings.calendarSync}
                    onCheckedChange={(checked) => saveSettings({ calendarSync: checked })}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Control your privacy settings and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your data is stored locally and encrypted. We never share your personal information with third parties.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Marketing Communications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features and tips
                    </p>
                  </div>
                  <Switch
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) => saveSettings({ marketingEmails: checked })}
                    disabled={isLoading}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Data Collection</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Reminder data is stored locally in your browser</p>
                    <p>• Settings are synchronized across your devices when logged in</p>
                    <p>• We collect anonymous usage statistics to improve the app</p>
                    <p>• No personal data is shared with third parties</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Account Security</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">Two-Factor Authentication</p>
                        <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">Active Sessions</p>
                        <p className="text-xs text-muted-foreground">Manage your logged-in devices</p>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        View Sessions
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export, backup, and manage your reminder data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">Export Data</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Download all your reminders, settings, and statistics as a JSON file
                    </p>
                    <Button onClick={exportData} className="w-full" disabled={isLoading}>
                      <Download className="h-4 w-4 mr-2" />
                      Export All Data
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-blue-500" />
                      <h4 className="font-medium">Reset Settings</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Reset all settings to their default values
                    </p>
                    <Button onClick={resetSettings} variant="outline" className="w-full" disabled={isLoading}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                </Card>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Storage Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Reminders Data</span>
                    <span className="text-sm font-medium">{userStats.storageUsed} KB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Settings Data</span>
                    <span className="text-sm font-medium">2 KB</span>
                  </div>
                  <Progress value={(userStats.storageUsed / 100) * 100} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    Total storage used: {userStats.storageUsed + 2} KB of unlimited
                  </p>
                </div>
              </div>

              <Separator />

              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <div className="space-y-3">
                    <p className="font-medium">Danger Zone</p>
                    <p className="text-sm">These actions are permanent and cannot be undone.</p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All Data
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              {showDeleteConfirm && (
                <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <div className="space-y-3">
                      <p className="font-medium">Are you absolutely sure?</p>
                      <p className="text-sm">This will permanently delete all your reminders, settings, and data. This action cannot be undone.</p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            localStorage.clear();
                            toast.success('All data deleted');
                            setShowDeleteConfirm(false);
                            window.location.reload();
                          }}
                        >
                          Yes, Delete Everything
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
