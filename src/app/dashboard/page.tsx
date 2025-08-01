'use client'

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reminders } from '@/components/Reminders';
import { NotificationSettings } from '@/components/NotificationSettings';
import { toast } from 'sonner';

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log('Dashboard useEffect:', { status, session: !!session });
    if (status === 'loading') return; // Still loading
    if (status === 'unauthenticated') {
      console.log('User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [session, status, router]);

  // Show welcome toast on first login
  useEffect(() => {
    if (session && searchParams.get('welcome') === 'true') {
      toast.success(`Welcome to Smart Reminder, ${session.user?.name ?? 'User'}!`);
      // Remove the welcome parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('welcome');
      window.history.replaceState({}, '', url.toString());
    }
  }, [session, searchParams]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect to login
  }

  if (!session) {
    return null; // Extra safety check
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid gap-4 sm:gap-6">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Welcome back, {session.user?.name ?? 'User'}! 👋
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Account Type:</span>
                  <Badge variant="secondary">
                    {session.user?.image ? 'Google Account' : 'Email Account'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm text-muted-foreground">{session.user?.email}</span>
                </div>
                {session.user?.name && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm text-muted-foreground">{session.user.name}</span>
                  </div>
                )}
                
                {/* Notification Settings */}
                <NotificationSettings />
              </div>
            </CardContent>
          </Card>

          {/* Reminders Section */}
          <Reminders />
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
