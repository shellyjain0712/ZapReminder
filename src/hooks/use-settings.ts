import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface UserSettings {
  // Notifications
  emailReminders: boolean;
  emailWeeklyDigest: boolean;
  emailSecurityAlerts: boolean;
  emailProductUpdates: boolean;
  pushReminders: boolean;
  pushInstant: boolean;
  pushWeeklyDigest: boolean;
  reminderSound: boolean;
  reminderTiming: string;
  reminderFrequency: string;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
  weekendNotifications: boolean;
  
  // Appearance
  fontSize: number;
  fontFamily: string;
  sidebarPosition: string;
  compactMode: boolean;
  animationsEnabled: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  language: string;
  dateFormat: string;
  timeFormat: string;
  
  // Privacy
  profileVisibility: string;
  showEmail: boolean;
  showActivity: boolean;
  showReminders: boolean;
  analyticsOptIn: boolean;
  crashReporting: boolean;
  usageStatistics: boolean;
  marketingEmails: boolean;
  locationTracking: boolean;
  activityTracking: boolean;
  crossDeviceSync: boolean;
  functionalCookies: boolean;
  analyticsCookies: boolean;
  marketingCookies: boolean;
  dataRetention: string;
  automaticDeletion: boolean;
}

const defaultSettings: UserSettings = {
  // Notifications
  emailReminders: true,
  emailWeeklyDigest: true,
  emailSecurityAlerts: true,
  emailProductUpdates: false,
  pushReminders: true,
  pushInstant: true,
  pushWeeklyDigest: false,
  reminderSound: true,
  reminderTiming: '15',
  reminderFrequency: 'daily',
  quietHours: true,
  quietStart: '22:00',
  quietEnd: '08:00',
  weekendNotifications: true,
  
  // Appearance
  fontSize: 16,
  fontFamily: 'system',
  sidebarPosition: 'left',
  compactMode: false,
  animationsEnabled: true,
  highContrast: false,
  reducedMotion: false,
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  
  // Privacy
  profileVisibility: 'private',
  showEmail: false,
  showActivity: false,
  showReminders: false,
  analyticsOptIn: true,
  crashReporting: true,
  usageStatistics: false,
  marketingEmails: false,
  locationTracking: false,
  activityTracking: true,
  crossDeviceSync: true,
  functionalCookies: true,
  analyticsCookies: false,
  marketingCookies: false,
  dataRetention: '1year',
  automaticDeletion: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Try to load from localStorage first
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as Partial<UserSettings>;
        setSettings({ ...defaultSettings, ...parsed });
      }
      
      // In a real app, you would also fetch from API here
      // const response = await fetch('/api/user/settings');
      // if (response.ok) {
      //   const serverSettings = await response.json();
      //   setSettings({ ...defaultSettings, ...serverSettings });
      // }
      
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ): Promise<boolean> => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
      
      // In a real app, you would also save to API here
      // await fetch('/api/user/settings', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ [key]: value })
      // });
      
      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
      return false;
    }
  };

  const resetSettings = async (): Promise<boolean> => {
    try {
      setSettings(defaultSettings);
      localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
      
      // In a real app, you would also reset on API here
      // await fetch('/api/user/settings/reset', { method: 'POST' });
      
      toast.success('Settings reset to defaults');
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
      return false;
    }
  };

  return {
    settings,
    isLoading,
    updateSetting,
    resetSettings,
  };
}
