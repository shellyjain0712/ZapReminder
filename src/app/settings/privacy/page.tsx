'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Users, 
  Share2, 
  Cookie, 
  BarChart3,
  MapPin,
  Clock,
  Info,
  AlertTriangle,
  Lock
} from 'lucide-react';

export default function PrivacySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Privacy preferences
  const [privacy, setPrivacy] = useState({
    // Profile visibility
    profileVisibility: 'private',
    showEmail: false,
    showActivity: false,
    showReminders: false,
    
    // Data sharing
    analyticsOptIn: true,
    crashReporting: true,
    usageStatistics: false,
    marketingEmails: false,
    
    // Location and tracking
    locationTracking: false,
    activityTracking: true,
    crossDeviceSync: true,
    
    // Cookies and tracking
    functionalCookies: true,
    analyticsCookies: false,
    marketingCookies: false,
    
    // Data retention
    dataRetention: '1year',
    automaticDeletion: false
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [session, status, router]);

  const updatePrivacySetting = async (key: string, value: string | boolean) => {
    setIsLoading(true);
    try {
      setPrivacy(prev => ({
        ...prev,
        [key]: value
      }));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Privacy settings updated');
    } catch {
      toast.error('Failed to update privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPrivacyData = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Preparing your data...',
        success: 'Privacy report downloaded',
        error: 'Failed to download data'
      }
    );
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
        <h1 className="text-3xl font-bold tracking-tight">Privacy Settings</h1>
        <p className="text-muted-foreground">
          Control your privacy settings and data sharing preferences.
        </p>
      </div>

      {/* Privacy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Overview
          </CardTitle>
          <CardDescription>
            Summary of your current privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              {privacy.profileVisibility === 'private' ? (
                <Lock className="h-5 w-5 text-green-500" />
              ) : (
                <Users className="h-5 w-5 text-blue-500" />
              )}
              <div>
                <p className="font-medium text-sm">Profile</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {privacy.profileVisibility}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              {privacy.analyticsOptIn ? (
                <BarChart3 className="h-5 w-5 text-orange-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-green-500" />
              )}
              <div>
                <p className="font-medium text-sm">Analytics</p>
                <p className="text-xs text-muted-foreground">
                  {privacy.analyticsOptIn ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              {privacy.locationTracking ? (
                <MapPin className="h-5 w-5 text-red-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-green-500" />
              )}
              <div>
                <p className="font-medium text-sm">Location</p>
                <p className="text-xs text-muted-foreground">
                  {privacy.locationTracking ? 'Tracking' : 'Not tracked'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile and activity information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Profile Visibility</Label>
            <Select 
              value={privacy.profileVisibility} 
              onValueChange={(value) => updatePrivacySetting('profileVisibility', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can see</SelectItem>
                <SelectItem value="friends">Friends Only</SelectItem>
                <SelectItem value="private">Private - Only me</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Show Email Address</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to see your email address
                </p>
              </div>
              <Switch
                checked={privacy.showEmail}
                onCheckedChange={(value) => updatePrivacySetting('showEmail', value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Show Activity Status</Label>
                <p className="text-sm text-muted-foreground">
                  Let others see when you&apos;re active
                </p>
              </div>
              <Switch
                checked={privacy.showActivity}
                onCheckedChange={(value) => updatePrivacySetting('showActivity', value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Show Reminder Statistics</Label>
                <p className="text-sm text-muted-foreground">
                  Display your reminder completion stats
                </p>
              </div>
              <Switch
                checked={privacy.showReminders}
                onCheckedChange={(value) => updatePrivacySetting('showReminders', value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Data Sharing & Analytics
          </CardTitle>
          <CardDescription>
            Choose what data you&apos;re comfortable sharing to improve our service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Analytics Data</Label>
                <p className="text-sm text-muted-foreground">
                  Help us improve the app by sharing usage analytics
                </p>
              </div>
              <Switch
                checked={privacy.analyticsOptIn}
                onCheckedChange={(value) => updatePrivacySetting('analyticsOptIn', value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Crash Reporting</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically send crash reports to help us fix bugs
                </p>
              </div>
              <Switch
                checked={privacy.crashReporting}
                onCheckedChange={(value) => updatePrivacySetting('crashReporting', value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Usage Statistics</Label>
                <p className="text-sm text-muted-foreground">
                  Share anonymous usage patterns and feature usage
                </p>
              </div>
              <Switch
                checked={privacy.usageStatistics}
                onCheckedChange={(value) => updatePrivacySetting('usageStatistics', value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Marketing Communications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails about new features and updates
                </p>
              </div>
              <Switch
                checked={privacy.marketingEmails}
                onCheckedChange={(value) => updatePrivacySetting('marketingEmails', value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & Tracking
          </CardTitle>
          <CardDescription>
            Manage location services and activity tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Location Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Allow the app to access your location for location-based reminders
                </p>
              </div>
              <Switch
                checked={privacy.locationTracking}
                onCheckedChange={(value) => updatePrivacySetting('locationTracking', value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Activity Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Track app usage to provide personalized insights
                </p>
              </div>
              <Switch
                checked={privacy.activityTracking}
                onCheckedChange={(value) => updatePrivacySetting('activityTracking', value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Cross-Device Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Sync your data across all your devices
                </p>
              </div>
              <Switch
                checked={privacy.crossDeviceSync}
                onCheckedChange={(value) => updatePrivacySetting('crossDeviceSync', value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cookies & Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Cookies & Tracking
          </CardTitle>
          <CardDescription>
            Manage cookie preferences and tracking technologies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Functional cookies are required for the app to work properly and cannot be disabled.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Functional Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Essential cookies required for basic functionality
                </p>
              </div>
              <Switch
                checked={privacy.functionalCookies}
                disabled={true}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Analytics Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Help us understand how you use the app
                </p>
              </div>
              <Switch
                checked={privacy.analyticsCookies}
                onCheckedChange={(value) => updatePrivacySetting('analyticsCookies', value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Marketing Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Used to show you relevant advertisements
                </p>
              </div>
              <Switch
                checked={privacy.marketingCookies}
                onCheckedChange={(value) => updatePrivacySetting('marketingCookies', value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Data Retention
          </CardTitle>
          <CardDescription>
            Control how long your data is stored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Data Retention Period</Label>
            <Select 
              value={privacy.dataRetention} 
              onValueChange={(value) => updatePrivacySetting('dataRetention', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">6 months</SelectItem>
                <SelectItem value="1year">1 year</SelectItem>
                <SelectItem value="2years">2 years</SelectItem>
                <SelectItem value="indefinite">Keep indefinitely</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How long to keep your data after account deletion
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Automatic Data Deletion</Label>
              <p className="text-sm text-muted-foreground">
                Automatically delete old reminders and activity data
              </p>
            </div>
            <Switch
              checked={privacy.automaticDeletion}
              onCheckedChange={(value) => updatePrivacySetting('automaticDeletion', value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Actions</CardTitle>
          <CardDescription>
            Download your data or learn more about our privacy practices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={downloadPrivacyData} variant="outline">
              Download My Data
            </Button>
            <Button variant="outline">
              View Privacy Policy
            </Button>
            <Button variant="outline">
              Contact Privacy Team
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              For questions about your privacy or to request data deletion, please contact our privacy team.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
