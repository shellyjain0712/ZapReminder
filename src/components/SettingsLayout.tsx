'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  User,
  Shield,
  Bell,
  Palette,
  Lock,
  Database,
  Settings as SettingsIcon
} from 'lucide-react';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const settingsNavigation = [
  {
    name: 'General',
    href: '/settings',
    icon: SettingsIcon,
    description: 'General settings and preferences'
  },
  {
    name: 'Profile',
    href: '/settings/profile',
    icon: User,
    description: 'Personal information and account details'
  },
  {
    name: 'Security',
    href: '/settings/security',
    icon: Shield,
    description: 'Password, 2FA, and security settings'
  },
  {
    name: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
    description: 'Email and push notification preferences'
  },
  {
    name: 'Appearance',
    href: '/settings/appearance',
    icon: Palette,
    description: 'Theme, layout, and display options'
  },
  {
    name: 'Privacy',
    href: '/settings/privacy',
    icon: Lock,
    description: 'Data privacy and sharing settings'
  },
  {
    name: 'Data Management',
    href: '/settings/data',
    icon: Database,
    description: 'Export, import, and backup options'
  }
];

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 gap-6 p-6">
      {/* Sidebar */}
      <aside className="w-64 shrink-0">
        <Card>
          <CardContent className="p-0">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Settings</h2>
              <p className="text-sm text-muted-foreground">
                Manage your account and preferences
              </p>
            </div>
            <nav className="p-2">
              {settingsNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-start gap-3 rounded-lg p-3 text-sm transition-all hover:bg-muted group",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 mt-0.5 shrink-0",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <div className="space-y-1">
                      <div className={cn(
                        "font-medium",
                        isActive ? "text-primary-foreground" : "text-foreground"
                      )}>
                        {item.name}
                      </div>
                      <div className={cn(
                        "text-xs leading-tight",
                        isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-6">
        {children}
      </main>
    </div>
  );
}
