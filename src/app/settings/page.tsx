'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Database, 
  Lock,
  ChevronRight,
  Calendar,
  Clock,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Reminder {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate: string;
}

const settingsCards = [
  {
    title: 'Profile',
    description: 'Manage your personal information and account details',
    href: '/settings/profile',
    icon: User,
    items: ['Name', 'Email', 'Avatar', 'Bio']
  },
  {
    title: 'Security',
    description: 'Password, two-factor authentication, and security options',
    href: '/settings/security',
    icon: Shield,
    items: ['Password', '2FA', 'Sessions', 'Login History']
  },
  {
    title: 'Notifications',
    description: 'Configure email and push notification preferences',
    href: '/settings/notifications',
    icon: Bell,
    items: ['Email Alerts', 'Push Notifications', 'Reminders', 'Weekly Summary']
  },
  {
    title: 'Appearance',
    description: 'Customize theme, layout, and display preferences',
    href: '/settings/appearance',
    icon: Palette,
    items: ['Theme', 'Language', 'Timezone', 'Date Format']
  },
  {
    title: 'Privacy',
    description: 'Control your data privacy and sharing preferences',
    href: '/settings/privacy',
    icon: Lock,
    items: ['Data Sharing', 'Analytics', 'Cookies', 'Third-party Access']
  },
  {
    title: 'Data Management',
    description: 'Export, import, and manage your reminder data',
    href: '/settings/data',
    icon: Database,
    items: ['Export Data', 'Import Reminders', 'Backup', 'Data Cleanup']
  }
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reminderStats, setReminderStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    isLoading: true
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    // Fetch reminder statistics
    void fetchReminderStats();
  }, [session, status, router]);

  const fetchReminderStats = async () => {
    try {
      // Fetch all reminders
      const response = await fetch('/api/reminders');
      if (!response.ok) {
        throw new Error('Failed to fetch reminders');
      }
      
      const data = await response.json() as { reminders: Reminder[] };
      const reminders: Reminder[] = data.reminders ?? [];
      
      const now = new Date();
      const total = reminders.length;
      const completed = reminders.filter((r: Reminder) => r.isCompleted).length;
      const pending = reminders.filter((r: Reminder) => !r.isCompleted).length;
      const overdue = reminders.filter((r: Reminder) => 
        !r.isCompleted && new Date(r.dueDate) < now
      ).length;
      
      setReminderStats({
        total,
        completed,
        pending,
        overdue,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching reminder stats:', error);
      toast.error('Failed to load reminder statistics');
      setReminderStats(prev => ({ ...prev, isLoading: false }));
    }
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
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Overview
          </CardTitle>
          <CardDescription>
            Your current account information and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">
                {session.user?.name ?? 'Not set'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {session.user?.email}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Account Type</p>
              <Badge variant="secondary">
                {session.user?.image ? 'Google Account' : 'Email Account'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {reminderStats.isLoading ? '...' : reminderStats.pending}
                </p>
                <p className="text-xs text-muted-foreground">Active Reminders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {reminderStats.isLoading ? '...' : reminderStats.completed}
                </p>
                <p className="text-xs text-muted-foreground">Completed Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {reminderStats.isLoading ? '...' : reminderStats.total}
                </p>
                <p className="text-xs text-muted-foreground">Total Reminders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Categories */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Settings Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{card.title}</CardTitle>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {card.items.map((item) => (
                        <Badge key={item} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
