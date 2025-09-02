/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarIcon, Clock, Bell, AlarmClock, Edit, Trash2, MoreVertical, Calendar, Download } from 'lucide-react';
import { formatDate, formatTime, formatDateTime } from '@/lib/date-utils';
import { toast } from 'sonner';
import { generateCalendarEvent, generateGoogleCalendarUrl, generateOutlookCalendarUrl } from '@/lib/calendar';

interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  isCompleted: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  emailNotification: boolean;
  pushNotification: boolean;
  reminderTime?: Date;
  notificationTime?: Date; // When to send advance notification email
  isSnooze: boolean;
  snoozeUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Recurring reminder fields
  isRecurring?: boolean;
  recurrenceType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  recurrenceInterval?: number;
  preDueNotifications?: number[];
}

interface ReminderCardProps {
  reminder: Reminder;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => Promise<void>;
  onSnooze: (id: string, snoozeUntil: Date) => Promise<void>;
  onView?: (reminder: Reminder) => void;
}

export function ReminderCard({ 
  reminder, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  onSnooze,
  onView 
}: ReminderCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-rose-400 dark:bg-rose-500';
      case 'HIGH': return 'bg-rose-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Check if reminder is overdue
  const isOverdue = () => {
    if (reminder.isCompleted) return false;
    
    const now = new Date();
    
    // If reminder is snoozed, check against snooze time instead
    if (reminder.isSnooze && reminder.snoozeUntil) {
      return reminder.snoozeUntil < now;
    }
    
    // Otherwise check against reminder time or due date
    const checkTime = reminder.reminderTime ?? reminder.dueDate;
    return checkTime < now;
  };

  const handleSnooze = (hours: number) => {
    const snoozeTime = new Date();
    snoozeTime.setHours(snoozeTime.getHours() + hours);
    void onSnooze(reminder.id, snoozeTime);
  };

  const handleAddToGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl({
      title: reminder.title,
      description: reminder.description,
      dueDate: reminder.dueDate,
      reminderTime: reminder.reminderTime,
    });
    window.open(url, '_blank');
    toast.success('Google Calendar opened');
  };

  const handleAddToOutlookCalendar = () => {
    const url = generateOutlookCalendarUrl({
      title: reminder.title,
      description: reminder.description,
      dueDate: reminder.dueDate,
      reminderTime: reminder.reminderTime,
    });
    window.open(url, '_blank');
    toast.success('Outlook Calendar opened');
  };

  const handleDownloadICS = () => {
    const { icalContent, filename } = generateCalendarEvent({
      title: reminder.title,
      description: reminder.description,
      dueDate: reminder.dueDate,
      reminderTime: reminder.reminderTime,
    });

    const blob = new Blob([icalContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Calendar event downloaded');
  };

  return (
    <Card className={`relative ${reminder.isCompleted ? 'opacity-75' : ''} ${
      isOverdue() ? 
        'overdue-reminder overdue-gradient-bg' : 
        'hover:shadow-lg'
    } transition-all duration-300 ease-in-out`}>
      <CardContent className="p-3 sm:p-4">
        {isOverdue() && !reminder.isCompleted && (
          <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-rose-400 to-rose-500 rounded-full flex items-center justify-center overdue-notification-dot">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div 
            className="flex items-start gap-2 sm:gap-3 flex-1 cursor-pointer hover:bg-muted/50 rounded-md p-1 sm:p-2 -m-1 sm:-m-2 transition-colors"
            onClick={() => onView?.(reminder)}
            title="Click to view details"
          >
            <Checkbox
              checked={reminder.isCompleted}
              onCheckedChange={(checked) => 
                onToggleComplete(reminder.id, checked as boolean)
              }
              onClick={(e) => e.stopPropagation()}
              className={`
                cursor-pointer bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-400 
                data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white 
                shadow-sm hover:shadow-md transition-shadow mt-1
                ${isOverdue() ? 'border-rose-300 dark:border-rose-400 data-[state=checked]:bg-rose-400 dark:data-[state=checked]:bg-rose-500' : ''}
              `}
            />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-start gap-1 sm:gap-2 flex-wrap">
                <h3 className={`font-medium text-sm sm:text-base leading-tight ${reminder.isCompleted ? 'line-through' : ''} ${
                  isOverdue() ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''
                } break-words`}>
                  {reminder.title}
                </h3>
              </div>
              
              {/* Badges row - better mobile layout */}
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <Badge className={`${getPriorityColor(reminder.priority)} text-white text-xs shadow-sm`}>
                  {reminder.priority}
                </Badge>
                {reminder.category && (
                  <Badge variant="outline" className={`text-xs ${
                    isOverdue() ? 'border-rose-300 dark:border-rose-400 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20' : ''
                  }`}>
                    {reminder.category}
                  </Badge>
                )}
                {isOverdue() && !reminder.isCompleted && (
                  <Badge className="bg-rose-400 dark:bg-rose-500/80 text-white text-xs shadow-sm border-0 transition-colors">
                    <span className="flex items-center gap-1">
                      ⚠️ <span className="hidden xs:inline">OVERDUE</span>
                    </span>
                  </Badge>
                )}
              </div>
              
              {reminder.description && (
                <p className={`text-xs sm:text-sm leading-relaxed ${
                  isOverdue() ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                } break-words`}>
                  {reminder.description}
                </p>
              )}
              
              <div className={`flex items-center gap-2 sm:gap-4 text-xs flex-wrap ${
                isOverdue() ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-muted-foreground'
              }`}>
                <div className="flex items-center gap-1">
                  <CalendarIcon className={`h-3 w-3 ${isOverdue() ? 'text-rose-500' : ''}`} />
                  <span className={`${isOverdue() ? 'font-semibold' : ''} whitespace-nowrap`}>
                    {formatDate(reminder.dueDate)}
                  </span>
                </div>
                {reminder.reminderTime && (
                  <div className="flex items-center gap-1">
                    <Clock className={`h-3 w-3 ${isOverdue() ? 'text-rose-500 dark:text-rose-400' : 'text-muted-foreground'}`} />
                    <span className={`${isOverdue() ? 'font-semibold text-rose-500 dark:text-rose-400' : ''} whitespace-nowrap`}>
                      {formatTime(reminder.reminderTime)}
                    </span>
                  </div>
                )}
                {reminder.emailNotification && (
                  <div className="flex items-center gap-1">
                    <Bell className={`h-3 w-3 ${isOverdue() ? 'text-rose-500' : ''}`} />
                    <span className="hidden sm:inline">Email</span>
                  </div>
                )}
                {reminder.isSnooze && reminder.snoozeUntil && (
                  <div className="flex items-center gap-1">
                    <AlarmClock className={`h-3 w-3 ${isOverdue() ? 'text-rose-500' : ''}`} />
                    <span className="hidden sm:inline">Until</span> <span className="whitespace-nowrap">{formatDateTime(reminder.snoozeUntil)}</span>
                  </div>
                )}
              </div>
              
              {/* Overdue indicator - separate row on mobile */}
              {isOverdue() && (
                <div className="flex items-center gap-1 bg-rose-400 dark:bg-rose-500/80 px-2 py-1 rounded-full text-white font-semibold text-xs w-fit">
                  <Clock className="h-3 w-3" />
                  <span className="whitespace-nowrap">
                    {(() => {
                      const now = new Date();
                      // Use snooze time if snoozed, otherwise use reminder time or due date
                      const checkTime = (reminder.isSnooze && reminder.snoozeUntil) 
                        ? reminder.snoozeUntil 
                        : (reminder.reminderTime ?? reminder.dueDate);
                      
                      const diffMs = now.getTime() - checkTime.getTime();
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffDays = Math.floor(diffHours / 24);
                      
                      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} overdue`;
                      if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} overdue`;
                      return 'Just overdue';
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 p-0 shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(reminder)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleSnooze(1)}>
                <AlarmClock className="h-4 w-4 mr-2" />
                Snooze 1 hour
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleSnooze(24)}>
                <AlarmClock className="h-4 w-4 mr-2" />
                Snooze 1 day
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleAddToGoogleCalendar}>
                <Calendar className="h-4 w-4 mr-2" />
                Add to Google Calendar
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => onDelete(reminder.id)}
                className="text-rose-500 focus:text-rose-500 dark:text-rose-400 dark:focus:text-rose-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
