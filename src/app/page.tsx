'use client'

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (session) router.push('/dashboard');
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (session) {
    return null; // Will redirect to dashboard
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Smart <span className="text-primary">Reminder</span>
        </h1>
        <p className="text-xl text-muted-foreground text-center max-w-2xl">
          Never miss a task again. Smart Reminder helps you stay organized and productive with intelligent reminders and task management.
        </p>
        
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8 mt-8">
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-card p-6 hover:bg-accent transition-colors">
            <h3 className="text-xl font-bold">📋 Task Management</h3>
            <div className="text-muted-foreground">
              Organize your tasks with categories, priorities, and due dates.
            </div>
          </div>
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-card p-6 hover:bg-accent transition-colors">
            <h3 className="text-xl font-bold">🔔 Smart Reminders</h3>
            <div className="text-muted-foreground">
              Get notified at the right time with intelligent reminder suggestions.
            </div>
          </div>
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-card p-6 hover:bg-accent transition-colors">
            <h3 className="text-xl font-bold">📊 Progress Tracking</h3>
            <div className="text-muted-foreground">
              Monitor your productivity and see how you&apos;re improving over time.
            </div>
          </div>
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-card p-6 hover:bg-accent transition-colors">
            <h3 className="text-xl font-bold">🎯 Goal Setting</h3>
            <div className="text-muted-foreground">
              Set and achieve your goals with structured planning and tracking.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
