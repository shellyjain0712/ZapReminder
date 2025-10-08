'use client';

import { useEffect } from 'react';
import { useSession } from "next-auth/react";
import { reminderNotificationManager } from '@/lib/reminder-notification-manager';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only start notifications if we have a valid session and it's ready
    if (status === 'authenticated' && session?.user?.email) {
      // Add a delay to ensure the app is fully loaded and server is stable
      const timer = setTimeout(() => {
        console.log('🔔 Starting notification manager for user:', session.user.email);
        void reminderNotificationManager.start();
      }, 5000); // Increased delay to 5 seconds
      
      return () => {
        clearTimeout(timer);
        reminderNotificationManager.stop();
      };
    } else if (status === 'unauthenticated') {
      // Stop notifications if user logs out
      console.log('🔕 Stopping notification manager - user not authenticated');
      reminderNotificationManager.stop();
    }
    // For 'loading' status, do nothing - wait for auth to resolve
  }, [session, status]);

  return <>{children}</>;
}
