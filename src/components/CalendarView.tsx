'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Plus, Clock, AlertCircle } from 'lucide-react';
import { format, isSameDay, isToday, isTomorrow, isYesterday, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

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
}

interface CalendarViewProps {
  reminders: Reminder[];
  onCreateReminder: (date: Date) => void;
  onReminderClick: (reminder: Reminder) => void;
  className?: string;
}

export function CalendarView({ reminders, onCreateReminder, onReminderClick, className }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Get reminders for selected date
  const selectedDateReminders = useMemo(() => {
    return reminders.filter(reminder => 
      isSameDay(reminder.dueDate, selectedDate) && !reminder.isCompleted
    );
  }, [reminders, selectedDate]);

  // Get dates that have reminders for calendar highlighting
  const reminderDates = useMemo(() => {
    const dates = new Set<string>();
    reminders.forEach(reminder => {
      if (!reminder.isCompleted) {
        dates.add(format(reminder.dueDate, 'yyyy-MM-dd'));
      }
    });
    return dates;
  }, [reminders]);

  // Get priority text color
  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-rose-500 dark:text-rose-400';
      case 'HIGH': return 'text-orange-600 dark:text-orange-400';
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400';
      case 'LOW': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Format date for display
  const formatSelectedDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar View
              </span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Quick Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Quick Add Reminder</DialogTitle>
                    <DialogDescription>
                      Select a date to quickly add a reminder.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          onCreateReminder(date);
                        }
                      }}
                      className="rounded-md border"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              onMonthChange={setCurrentMonth}
              className="w-full"
              modifiers={{
                hasReminders: (date) => reminderDates.has(format(date, 'yyyy-MM-dd'))
              }}
              modifiersClassNames={{
                hasReminders: 'font-bold bg-primary/10 text-primary'
              }}
            />
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {formatSelectedDate(selectedDate)}
            </CardTitle>
            {selectedDateReminders.length > 0 && (
              <Badge variant="secondary" className="w-fit">
                {selectedDateReminders.length} reminder{selectedDateReminders.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDateReminders.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No reminders for this date</p>
                <Button 
                  onClick={() => onCreateReminder(selectedDate)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Reminder
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateReminders.map((reminder) => (
                  <Card 
                    key={reminder.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onReminderClick(reminder)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{reminder.title}</h4>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getPriorityTextColor(reminder.priority))}
                            >
                              {reminder.priority}
                            </Badge>
                          </div>
                          {reminder.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {reminder.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {reminder.reminderTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(reminder.reminderTime, 'h:mm a')}
                              </div>
                            )}
                            {reminder.category && (
                              <Badge variant="secondary" className="text-xs">
                                {reminder.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {reminder.priority === 'URGENT' && (
                          <AlertCircle className="h-4 w-4 text-rose-500 ml-2" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button 
                  onClick={() => onCreateReminder(selectedDate)}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Another
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview - {format(currentMonth, 'MMMM yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyOverview reminders={reminders} currentMonth={currentMonth} />
        </CardContent>
      </Card>
    </div>
  );
}

// Monthly Overview Component
function MonthlyOverview({ reminders, currentMonth }: { reminders: Reminder[]; currentMonth: Date }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const monthlyStats = useMemo(() => {
    const monthReminders = reminders.filter(reminder => 
      reminder.dueDate >= monthStart && reminder.dueDate <= monthEnd
    );
    
    const total = monthReminders.length;
    const completed = monthReminders.filter(r => r.isCompleted).length;
    const pending = total - completed;
    const overdue = monthReminders.filter(r => 
      !r.isCompleted && r.dueDate < new Date()
    ).length;
    
    const byPriority = {
      URGENT: monthReminders.filter(r => r.priority === 'URGENT' && !r.isCompleted).length,
      HIGH: monthReminders.filter(r => r.priority === 'HIGH' && !r.isCompleted).length,
      MEDIUM: monthReminders.filter(r => r.priority === 'MEDIUM' && !r.isCompleted).length,
      LOW: monthReminders.filter(r => r.priority === 'LOW' && !r.isCompleted).length,
    };
    
    return { total, completed, pending, overdue, byPriority };
  }, [reminders, monthStart, monthEnd]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{monthlyStats.total}</div>
        <div className="text-sm text-muted-foreground">Total</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{monthlyStats.completed}</div>
        <div className="text-sm text-muted-foreground">Completed</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{monthlyStats.pending}</div>
        <div className="text-sm text-muted-foreground">Pending</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-rose-500">{monthlyStats.overdue}</div>
        <div className="text-sm text-muted-foreground">Overdue</div>
      </div>
      
      {/* Priority Breakdown */}
      <div className="col-span-2 md:col-span-4 mt-4">
        <h4 className="font-medium mb-2">Pending by Priority</h4>
        <div className="grid grid-cols-4 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
            <span className="text-sm">Urgent: {monthlyStats.byPriority.URGENT}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm">High: {monthlyStats.byPriority.HIGH}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm">Medium: {monthlyStats.byPriority.MEDIUM}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm">Low: {monthlyStats.byPriority.LOW}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
