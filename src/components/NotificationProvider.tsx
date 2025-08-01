'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { reminderNotificationManager } from '@/lib/reminder-notification-manager';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Start notification checking when user is authenticated
      void reminderNotificationManager.start();
      
      return () => {
        // Stop notification checking when component unmounts
        reminderNotificationManager.stop();
      };
    }
  }, [session, status]);

  return <>{children}</>;
}
