'use client';

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Home, 
  Settings, 
  LogOut,
  Calendar,
  Users,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDisplayName, getUserInitials } from '@/lib/user-utils';

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      toast.success("Signing out...");
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      });
    } catch (err) {
      console.error("Sign out error:", err);
      toast.error("Error signing out");
      // Fallback redirect if signOut fails
      router.push('/');
    }
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: pathname === '/dashboard'
    },
    {
      name: 'Calendar',
      href: '/test-calendar',
      icon: Calendar,
      current: pathname === '/test-calendar'
    },
    {
      name: 'Collaborative',
      href: '/collaborative',
      icon: Users,
      current: pathname === '/collaborative'
    },
    {
      name: 'WhatsApp',
      href: '/whatsapp',
      icon: MessageCircle,
      current: pathname === '/whatsapp'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: pathname.startsWith('/settings')
    }
  ];

  if (!session) return null;

  return (
    <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SR</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">Smart Reminder</span>
            <span className="font-bold text-lg sm:hidden">SR</span>
          </Link>
          
          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Right side - Navigation & User Menu */}
          <div className="flex items-center gap-2">
            {/* Desktop Navigation - moved to right */}
            <nav className="hidden md:flex items-center gap-1 mr-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      item.current
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={undefined} />
                    <AvatarFallback>
                      {getUserInitials(session.user?.name, session.user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">
                      {formatDisplayName(session.user?.name, session.user?.email)}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {session.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Only Logout Option */}
                <DropdownMenuItem 
                  className="cursor-pointer text-rose-500 focus:text-rose-500 dark:text-rose-400 dark:focus:text-rose-400"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
