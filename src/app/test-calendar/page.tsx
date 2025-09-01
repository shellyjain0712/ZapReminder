/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Filter } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isToday, isSameMonth } from 'date-fns';
import { toast } from 'sonner';

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
  isSnooze: boolean;
  snoozeUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [selectedDateForSummary, setSelectedDateForSummary] = useState<Date | null>(null);

  // Toggle reminder completion
  const toggleReminderComplete = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: completed }),
      });

      if (response.ok) {
        await fetchReminders();
        toast.success(completed ? 'Reminder completed!' : 'Reminder marked as pending');
      } else {
        toast.error('Failed to update reminder');
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast.error('Failed to update reminder');
    }
  };

  // Fetch reminders
  useEffect(() => {
    void fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/reminders');
      if (response.ok) {
        const data = await response.json() as any[];
        const formattedReminders: Reminder[] = data.map((reminder) => ({
          ...reminder,
          dueDate: new Date(reminder.dueDate),
          reminderTime: reminder.reminderTime ? new Date(reminder.reminderTime) : undefined,
          snoozeUntil: reminder.snoozeUntil ? new Date(reminder.snoozeUntil) : undefined,
          createdAt: new Date(reminder.createdAt),
          updatedAt: new Date(reminder.updatedAt),
          isCompleted: reminder.completed ?? false,
        }));
        setReminders(formattedReminders);
      }
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  // Get calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get reminders for a specific date
  const getRemindersForDate = (date: Date) => {
    return reminders.filter(reminder => 
      isSameDay(reminder.dueDate, date) && 
      !reminder.isCompleted &&
      (selectedCategory === 'all' || reminder.category === selectedCategory)
    );
  };

  // Get selected date reminders
  const selectedDateReminders = getRemindersForDate(selectedDate);

  // Get unique categories
  const categories = Array.from(new Set(reminders.map(r => r.category).filter((c): c is string => typeof c === 'string')));

  // Priority colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Category colors
  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-purple-500',
      'bg-green-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-cyan-500'
    ];
    const index = categories.indexOf(category) % colors.length;
    return colors[index];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Calendar</h1>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-sm sm:text-base font-semibold min-w-[120px] sm:min-w-[160px] text-center text-foreground">
                {format(currentMonth, 'MMM yyyy')}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32 sm:w-40">
                <Filter className="h-4 w-4 mr-1 sm:mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2" size="sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Event</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 p-2 sm:p-3 lg:p-4">
          <Card className="h-full">
            <CardContent className="p-1 sm:p-2 lg:p-3">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-px mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-1 text-center text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {calendarDays.map((day) => {
                  const dayReminders = getRemindersForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday_ = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        min-h-[40px] sm:min-h-[50px] md:min-h-[55px] lg:min-h-[60px] xl:min-h-[70px] bg-card p-1 cursor-pointer hover:bg-muted/50 relative transition-colors
                        ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : ''}
                        ${isSelected ? 'ring-2 ring-primary' : ''}
                        ${isToday_ ? 'bg-primary/10 dark:bg-primary/20' : ''}
                      `}
                      onClick={() => {
                        setSelectedDate(day);
                        setSelectedDateForSummary(day);
                      }}
                    >
                      {/* Date number */}
                      <div className={`
                        text-xs font-medium mb-0.5
                        ${isToday_ ? 'text-primary font-bold' : ''}
                        ${!isCurrentMonth ? 'text-muted-foreground' : 'text-foreground'}
                      `}>
                        {format(day, 'd')}
                      </div>

                      {/* Events */}
                      <div className="space-y-0.5">
                        {dayReminders.slice(0, 2).map((reminder) => (
                          <div
                            key={reminder.id}
                            className={`
                              text-xs px-1 py-0.5 rounded text-white truncate flex items-center gap-1 cursor-pointer hover:opacity-80
                              ${reminder.category ? getCategoryColor(reminder.category) : getPriorityColor(reminder.priority)}
                              ${reminder.isCompleted ? 'opacity-60' : ''}
                            `}
                            title={`${reminder.title} ${reminder.isCompleted ? '(Completed)' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReminder(reminder);
                            }}
                          >
                            <Checkbox
                              checked={reminder.isCompleted}
                              onCheckedChange={(checked) => {
                                void toggleReminderComplete(reminder.id, checked as boolean);
                              }}
                              className="h-3 w-3 shrink-0 bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:text-white data-[state=checked]:border-primary shadow-md"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className={`
                              hidden md:inline text-xs flex-1 truncate
                              ${reminder.isCompleted ? 'line-through' : ''}
                            `}>
                              {reminder.title}
                            </span>
                            <span className={`
                              md:hidden
                              ${reminder.isCompleted ? 'line-through' : ''}
                            `}>
                              •
                            </span>
                          </div>
                        ))}
                        {dayReminders.length > 2 && (
                          <div 
                            className="text-xs text-muted-foreground px-1 cursor-pointer hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Show first additional reminder in popup
                              if (dayReminders[2]) {
                                setSelectedReminder(dayReminders[2]);
                              }
                            }}
                          >
                            +{dayReminders.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 bg-card border-t lg:border-t-0 lg:border-l border-border p-2 sm:p-3 lg:p-4 overflow-y-auto max-h-80 lg:max-h-none">
          <div className="space-y-3 lg:space-y-4">
            {/* Selected Date */}
            <div>
              <h3 className="text-sm lg:text-base font-semibold mb-1 text-foreground">
                {format(selectedDate, 'EEE, MMM d')}
              </h3>
              {isToday(selectedDate) && (
                <Badge variant="secondary" className="mb-2 text-xs">Today</Badge>
              )}
            </div>

            {/* Today's Events */}
            <div>
              <h4 className="font-medium text-foreground mb-2 text-xs lg:text-sm">
                Events ({selectedDateReminders.length})
              </h4>
              {selectedDateReminders.length === 0 ? (
                <div className="text-center py-3 lg:py-4 text-muted-foreground">
                  <CalendarIcon className="h-6 lg:h-8 w-6 lg:w-8 mx-auto mb-1 lg:mb-2 text-muted-foreground/50" />
                  <p className="text-xs">No events for this date</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-1 lg:mt-2 text-xs"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    Add Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-1 lg:space-y-2">
                  {selectedDateReminders.map((reminder) => (
                    <Card 
                      key={reminder.id} 
                      className="p-2 hover:shadow-md transition-shadow border-border cursor-pointer"
                      onClick={() => setSelectedReminder(reminder)}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={reminder.isCompleted}
                          onCheckedChange={(checked) => 
                            void toggleReminderComplete(reminder.id, checked as boolean)
                          }
                          className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white shadow-sm cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <div className={`w-2 h-2 rounded-full ${reminder.category ? getCategoryColor(reminder.category) : getPriorityColor(reminder.priority)}`} />
                            <h5 className={`font-medium text-xs truncate text-foreground ${reminder.isCompleted ? 'line-through opacity-60' : ''}`}>
                              {reminder.title}
                            </h5>
                          </div>
                          {reminder.description && (
                            <p className={`text-xs text-muted-foreground line-clamp-2 mb-1 ${reminder.isCompleted ? 'line-through opacity-60' : ''}`}>
                              {reminder.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-1 lg:gap-2 text-xs text-muted-foreground">
                            {reminder.reminderTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(reminder.reminderTime, 'h:mm a')}
                              </div>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {reminder.priority}
                            </Badge>
                            {reminder.category && (
                              <Badge variant="secondary" className="text-xs">
                                {reminder.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="pt-3 lg:pt-4 border-t border-border">
              <h4 className="font-medium text-foreground mb-2 text-xs lg:text-sm">Quick Stats</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Events</span>
                  <span className="font-medium text-foreground">{reminders.filter(r => !r.isCompleted).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">This Month</span>
                  <span className="font-medium text-foreground">
                    {reminders.filter(r => 
                      !r.isCompleted && 
                      isSameMonth(r.dueDate, currentMonth)
                    ).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categories</span>
                  <span className="font-medium text-foreground">{categories.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Create New Event</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new event for {format(selectedDate, 'EEE, MMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <ReminderForm 
            selectedDate={selectedDate}
            onSuccess={() => {
              setShowCreateDialog(false);
              void fetchReminders();
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Reminder Details Dialog */}
      {selectedReminder && (
        <Dialog open={!!selectedReminder} onOpenChange={() => setSelectedReminder(null)}>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold pr-8">
                {selectedReminder.title}
              </DialogTitle>
              <DialogDescription>
                Reminder details and information
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={selectedReminder.isCompleted ? "default" : "secondary"}>
                  {selectedReminder.isCompleted ? "Completed" : "Pending"}
                </Badge>
                {selectedReminder.isSnooze && selectedReminder.snoozeUntil && (
                  <Badge variant="outline">
                    Snoozed until {format(selectedReminder.snoozeUntil, 'MMM d, h:mm a')}
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <div 
                  className={`
                    p-3 rounded-lg border-2
                    ${selectedReminder.priority === 'URGENT' ? 'border-red-500 text-red-600' : ''}
                    ${selectedReminder.priority === 'HIGH' ? 'border-orange-500 text-orange-600' : ''}
                    ${selectedReminder.priority === 'MEDIUM' ? 'border-yellow-500 text-yellow-600' : ''}
                    ${selectedReminder.priority === 'LOW' ? 'border-green-500 text-green-600' : ''}
                  `}
                >
                  {selectedReminder.priority} Priority
                </div>

                {selectedReminder.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <div className="mt-1 p-2 bg-muted rounded-md">
                      <p className="text-sm">{selectedReminder.description}</p>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(selectedReminder.dueDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>

                {selectedReminder.reminderTime && (
                  <div>
                    <Label className="text-sm font-medium">Reminder Time</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(selectedReminder.reminderTime, 'h:mm a')}
                    </p>
                  </div>
                )}

                {selectedReminder.category && (
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <Badge variant="secondary" className="mt-1">
                      {selectedReminder.category}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${selectedReminder.emailNotification ? 'bg-green-500' : 'bg-gray-300'}`} />
                    Email
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${selectedReminder.pushNotification ? 'bg-green-500' : 'bg-gray-300'}`} />
                    Push
                  </div>
                </div>

                <div className="pt-3 border-t text-xs text-muted-foreground">
                  <p>Created: {format(selectedReminder.createdAt, 'MMM d, yyyy h:mm a')}</p>
                  <p>Updated: {format(selectedReminder.updatedAt, 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Date Summary Dialog */}
      {selectedDateForSummary && (
        <Dialog open={!!selectedDateForSummary} onOpenChange={() => setSelectedDateForSummary(null)}>
          <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                📅 {format(selectedDateForSummary, 'EEEE, MMMM d, yyyy')}
              </DialogTitle>
              <DialogDescription>
                {isToday(selectedDateForSummary) ? 'Today\'s Events' : 'All events for this date'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">
                    {getRemindersForDate(selectedDateForSummary).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Events</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {getRemindersForDate(selectedDateForSummary).filter(r => r.isCompleted).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </div>

              {/* Priority Breakdown */}
              {getRemindersForDate(selectedDateForSummary).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Priority Breakdown</h4>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {(['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map(priority => {
                      const count = getRemindersForDate(selectedDateForSummary).filter(r => r.priority === priority).length;
                      const colors = {
                        URGENT: 'text-red-600 bg-red-50',
                        HIGH: 'text-orange-600 bg-orange-50',
                        MEDIUM: 'text-yellow-600 bg-yellow-50',
                        LOW: 'text-green-600 bg-green-50'
                      };
                      return (
                        <div key={priority} className={`p-2 rounded text-center ${colors[priority]}`}>
                          <div className="font-bold">{count}</div>
                          <div>{priority}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Events List */}
              <div>
                <h4 className="font-medium mb-3">
                  Events ({getRemindersForDate(selectedDateForSummary).length})
                </h4>
                {getRemindersForDate(selectedDateForSummary).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm mb-3">No events scheduled for this date</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedDateForSummary(null);
                        setShowCreateDialog(true);
                      }}
                    >
                      Add Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {getRemindersForDate(selectedDateForSummary).map((reminder) => (
                      <div 
                        key={reminder.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedDateForSummary(null);
                          setSelectedReminder(reminder);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={reminder.isCompleted}
                            onCheckedChange={(checked) => {
                              void toggleReminderComplete(reminder.id, checked as boolean);
                            }}
                            className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-3 h-3 rounded-full ${reminder.category ? getCategoryColor(reminder.category) : getPriorityColor(reminder.priority)}`} />
                              <h5 className={`font-medium text-sm truncate ${reminder.isCompleted ? 'line-through opacity-60' : ''}`}>
                                {reminder.title}
                              </h5>
                              <Badge variant="outline" className="text-xs">
                                {reminder.priority}
                              </Badge>
                            </div>
                            {reminder.description && (
                              <p className={`text-xs text-muted-foreground line-clamp-1 mb-1 ${reminder.isCompleted ? 'line-through opacity-60' : ''}`}>
                                {reminder.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Reminder Form Component
function ReminderForm({ 
  selectedDate, 
  onSuccess, 
  onCancel 
}: { 
  selectedDate: Date; 
  onSuccess: () => void; 
  onCancel: () => void; 
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [category, setCategory] = useState('');
  const [emailNotification, setEmailNotification] = useState(true);
  const [pushNotification, setPushNotification] = useState(true);
  const [reminderTime, setReminderTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const reminderData = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: selectedDate.toISOString(),
        priority,
        category: category.trim() || undefined,
        emailNotification,
        pushNotification,
        reminderTime: reminderTime ? new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${reminderTime}`).toISOString() : undefined,
      };

      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create reminder');
      }

      toast.success(`🎉 "${title}" has been added to your calendar!`);
      onSuccess();
    } catch (error) {
      console.error('Failed to create reminder:', error);
      toast.error('❌ Failed to create reminder. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter reminder title..."
          required
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter reminder description..."
          rows={2}
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="priority" className="text-sm">Priority</Label>
          <Select value={priority} onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => setPriority(value)}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm">Category (Optional)</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Work, Personal"
            className="text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reminderTime" className="text-sm">Reminder Time (Optional)</Label>
        <Input
          id="reminderTime"
          type="time"
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
          className="text-sm"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="emailNotification" className="text-sm">Email Notification</Label>
          <Switch
            id="emailNotification"
            checked={emailNotification}
            onCheckedChange={setEmailNotification}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="pushNotification" className="text-sm">Push Notification</Label>
          <Switch
            id="pushNotification"
            checked={pushNotification}
            onCheckedChange={setPushNotification}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-3">
        <Button type="submit" disabled={isSubmitting || !title.trim()} className="text-sm">
          {isSubmitting ? '⏳ Creating...' : '✨ Create Reminder'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="text-sm">
          Cancel
        </Button>
      </div>
    </form>
  );
}
