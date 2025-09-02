/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Plus, Users, Eye, Edit, Target, Crown, UserPlus, X, Mail, Clock, Bell, AlarmClock, Repeat, Minus } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/date-utils';
import { toast } from 'sonner';
import { ReminderCard } from './ReminderCard';
import { addReminderToCalendar } from '@/lib/calendar-integration';

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

interface RemindersProps {
  initialReminders?: Reminder[];
}

export function Reminders({ initialReminders = [] }: RemindersProps) {
  const { data: session } = useSession();
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  // Fetch reminders - memoized to prevent unnecessary re-renders
  const fetchReminders = useCallback(async () => {
    if (!session) return [];
    
    setLoading(true);
    try {
      const response = await fetch('/api/reminders');
      if (response.ok) {
        const data = await response.json();
        const processedReminders = data.map((r: {
          id: string;
          title: string;
          description?: string;
          dueDate: string;
          priority: string;
          category?: string;
          isCompleted: boolean;
          emailNotification?: boolean;
          pushNotification?: boolean;
          reminderTime?: string;
          snoozeUntil?: string;
          isSnooze?: boolean;
          userId: string;
          createdAt: string;
          updatedAt: string;
          // Recurring fields
          isRecurring?: boolean;
          recurrenceType?: string;
          recurrenceInterval?: number;
          preDueNotifications?: number[];
        }) => ({
          ...r,
          dueDate: new Date(r.dueDate),
          reminderTime: r.reminderTime ? new Date(r.reminderTime) : undefined,
          snoozeUntil: r.snoozeUntil ? new Date(r.snoozeUntil) : undefined,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        }));
        setReminders(processedReminders);
        return processedReminders;
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast.error('Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
    return [];
  }, [session]);

  useEffect(() => {
    if (!session) return;
    
    // Fetch reminders on mount
    void fetchReminders();
  }, [session, fetchReminders]);

  const filteredReminders = reminders.filter(reminder => {
    if (filter === 'completed') return reminder.isCompleted;
    if (filter === 'pending') return !reminder.isCompleted;
    return true;
  });

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: completed }),
      });

      if (response.ok) {
        await fetchReminders();
        toast.success(completed ? 'Task completed!' : 'Task marked as pending');
      } else {
        toast.error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const result = await response.json();
        await fetchReminders();
        
        // Show appropriate message based on whether it was collaborative
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (result.wasCollaborative) {
          toast.success('🗑️ Collaborative reminder deleted! All team members have been notified.', {
            duration: 4000,
          });
        } else {
          toast.success('Task deleted successfully');
        }
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Failed to delete task');
    }
  };

  const snoozeReminder = async (id: string, snoozeUntil: Date) => {
    try {
      const response = await fetch(`/api/reminders/${id}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snoozeUntil: snoozeUntil.toISOString() }),
      });

      if (response.ok) {
        await fetchReminders();
        toast.success('Task snoozed successfully');
      } else {
        toast.error('Failed to snooze task');
      }
    } catch (error) {
      console.error('Error snoozing reminder:', error);
      toast.error('Failed to snooze task');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">My Reminders</h2>
          <p className="text-muted-foreground">
            Manage your tasks and stay organized
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button 
              size="lg"
              className="w-full sm:w-auto font-medium shadow-sm hover:shadow-md transition-all duration-200">
              <Plus className="h-5 w-5 mr-2" />
              Create Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Create New Reminder</DialogTitle>
              <DialogDescription>
                Fill out the form below to create a new reminder. Set the due date, priority, and notification preferences.
              </DialogDescription>
            </DialogHeader>
            <ReminderForm
              onSubmit={async (data) => {
                try {
                  // Check if we have collaborators
                  const hasCollaborators = data.collaborators && data.collaborators.length > 0;
                  
                  const response = await fetch('/api/reminders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  });

                  if (response.ok) {
                    await fetchReminders();
                    setShowAddDialog(false);
                    
                    // Show success message with collaboration info
                    if (hasCollaborators) {
                      toast.success(`Reminder created and shared with ${data.collaborators!.length} collaborator(s)! 🎉`, {
                        description: 'Invitation emails have been sent.',
                        duration: 4000,
                      });
                    } else {
                      toast.success('Reminder created successfully');
                    }
                    
                    // Only add to calendar if user enabled the option
                    if (data.autoAddToCalendar) {
                      try {
                        toast.info('📅 Adding to calendar...', {
                          description: 'Opening calendar integration',
                          duration: 2000
                        });
                        
                        const result = await addReminderToCalendar(
                          data.title,
                          data.description,
                          new Date(data.dueDate),
                          data.reminderTime ? new Date(data.reminderTime) : undefined
                        );
                        
                        if (result.success) {
                          console.log(`✅ Calendar integration: ${result.method} - ${result.message}`);
                          // Don't show additional success message since the calendar integration shows its own
                        } else {
                          console.warn(`⚠️ Calendar integration failed: ${result.message}`);
                          toast.warning('Calendar integration failed - you can manually add it later');
                        }
                      } catch (calendarError) {
                        console.error('Error with calendar integration:', calendarError);
                        toast.info('Manual calendar addition: Use the dropdown menu on the reminder card');
                      }
                    }
                  } else {
                    toast.error('Failed to create reminder');
                  }
                } catch (error) {
                  console.error('Error creating reminder:', error);
                  toast.error('Failed to create reminder');
                }
              }}
              onCancel={() => setShowAddDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
          className="flex-1 sm:flex-none min-w-0"
        >
          <span className="truncate">All ({reminders.length})</span>
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
          size="sm"
          className="flex-1 sm:flex-none min-w-0"
        >
          <span className="truncate">Pending ({reminders.filter(r => !r.isCompleted).length})</span>
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          size="sm"
          className="flex-1 sm:flex-none min-w-0"
        >
          <span className="truncate">Completed ({reminders.filter(r => r.isCompleted).length})</span>
        </Button>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No reminders found.</p>
          <p className="text-sm">Create your first reminder to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReminders.map(reminder => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onToggleComplete={toggleComplete}
              onEdit={setEditingReminder}
              onDelete={deleteReminder}
              onSnooze={snoozeReminder}
              onView={setSelectedReminder}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingReminder && (
        <Dialog open={!!editingReminder} onOpenChange={() => setEditingReminder(null)}>
          <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Edit Reminder</DialogTitle>
              <DialogDescription>
                Modify the reminder details below. Update the title, description, due date, priority, or notification settings.
              </DialogDescription>
            </DialogHeader>
            <ReminderForm
              reminder={editingReminder}
              onSubmit={async (data) => {
                try {
                  const response = await fetch(`/api/reminders/${editingReminder.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  });

                  if (response.ok) {
                    await fetchReminders();
                    setEditingReminder(null);
                    toast.success('Reminder updated successfully');
                  } else {
                    toast.error('Failed to update reminder');
                  }
                } catch (error) {
                  console.error('Error updating reminder:', error);
                  toast.error('Failed to update reminder');
                }
              }}
              onCancel={() => setEditingReminder(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Detailed View Modal */}
      {selectedReminder && (
        <Dialog open={!!selectedReminder} onOpenChange={() => setSelectedReminder(null)}>
          <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                {selectedReminder.title}
              </DialogTitle>
              <DialogDescription>
                Complete details of your reminder
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedReminder.isCompleted ? "default" : "secondary"}>
                        {selectedReminder.isCompleted ? "Completed" : "Pending"}
                      </Badge>
                      {selectedReminder.isSnooze && selectedReminder.snoozeUntil && (
                        <Badge variant="outline" className="text-orange-600">
                          Snoozed until {formatDate(selectedReminder.snoozeUntil)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${selectedReminder.priority === 'URGENT' ? 'border-red-500 text-red-600' : ''}
                        ${selectedReminder.priority === 'HIGH' ? 'border-orange-500 text-orange-600' : ''}
                        ${selectedReminder.priority === 'MEDIUM' ? 'border-yellow-500 text-yellow-600' : ''}
                        ${selectedReminder.priority === 'LOW' ? 'border-green-500 text-green-600' : ''}
                      `}
                    >
                      {selectedReminder.priority}
                    </Badge>
                  </div>
                </div>

                {selectedReminder.description && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm">{selectedReminder.description}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4" />
                      {formatDate(selectedReminder.dueDate)}
                    </div>
                  </div>

                  {selectedReminder.category && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                      <Badge variant="outline">{selectedReminder.category}</Badge>
                    </div>
                  )}
                </div>

                {selectedReminder.reminderTime && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Reminder Time</Label>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      {formatDateTime(selectedReminder.reminderTime)}
                    </div>
                  </div>
                )}
              </div>

              {/* Recurring Information */}
              {selectedReminder.isRecurring && (
                <div className="space-y-4 border-t pt-4">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlarmClock className="h-4 w-4" />
                    Recurring Settings
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Recurrence Type</Label>
                      <Badge variant="outline" className="text-blue-600 border-blue-500">
                        {selectedReminder.recurrenceType}
                      </Badge>
                    </div>
                    
                    {selectedReminder.recurrenceInterval && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Interval</Label>
                        <Badge variant="outline">
                          Every {selectedReminder.recurrenceInterval} {selectedReminder.recurrenceType?.toLowerCase()}(s)
                        </Badge>
                      </div>
                    )}
                  </div>

                  {selectedReminder.preDueNotifications && selectedReminder.preDueNotifications.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Pre-due Notifications</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedReminder.preDueNotifications.map((days) => (
                          <Badge key={days} variant="outline" className="text-purple-600 border-purple-500">
                            {days} day{days !== 1 ? 's' : ''} before
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notification Settings */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notification Preferences
                </Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Email Notifications</span>
                    <Badge variant={selectedReminder.emailNotification ? "default" : "secondary"}>
                      {selectedReminder.emailNotification ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm">Push Notifications</span>
                    <Badge variant={selectedReminder.pushNotification ? "default" : "secondary"}>
                      {selectedReminder.pushNotification ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-sm font-medium text-muted-foreground">Timeline</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Created:</span>
                    <p>{formatDateTime(selectedReminder.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <p>{formatDateTime(selectedReminder.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button 
                  onClick={() => {
                    setEditingReminder(selectedReminder);
                    setSelectedReminder(null);
                  }}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Reminder
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedReminder(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export interface ReminderFormProps {
  reminder?: Reminder;
  onSubmit: (data: {
    title: string;
    description?: string;
    dueDate: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    category?: string;
    emailNotification: boolean;
    pushNotification: boolean;
    reminderTime?: string;
    notificationTime?: string;
    autoAddToCalendar?: boolean;
    collaborators?: Array<{
      email: string;
      role: 'VIEWER' | 'EDITOR' | 'ASSIGNEE' | 'MANAGER';
      message?: string;
    }>;
    isRecurring?: boolean;
    recurrenceType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
    recurrenceInterval?: number;
    preDueNotifications?: number[];
  }) => void;
  onCancel: () => void;
}

export function ReminderForm({ reminder, onSubmit, onCancel }: ReminderFormProps) {
    // Recurrence states
    const [isRecurring, setIsRecurring] = useState(reminder?.isRecurring ?? false);
    const [recurrenceType, setRecurrenceType] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM">(reminder?.recurrenceType ?? "DAILY");
    const [recurrenceInterval, setRecurrenceInterval] = useState(reminder?.recurrenceInterval ?? 1);
    const [preDueNotifications, setPreDueNotifications] = useState<number[]>(reminder?.preDueNotifications ?? [1]);
  const [title, setTitle] = useState(reminder?.title ?? '');
  const [description, setDescription] = useState(reminder?.description ?? '');
  const [dueDate, setDueDate] = useState<Date>(reminder?.dueDate ?? new Date());
  const [priority, setPriority] = useState(reminder?.priority ?? 'MEDIUM');
  const [category, setCategory] = useState(reminder?.category ?? '');
  const [emailNotification, setEmailNotification] = useState(reminder?.emailNotification ?? true);
  const [pushNotification, setPushNotification] = useState(reminder?.pushNotification ?? true);
  const [autoAddToCalendar, setAutoAddToCalendar] = useState(true); // New state for calendar integration
  const [hasSpecificTime, setHasSpecificTime] = useState(!!reminder?.reminderTime);
  const [timeString, setTimeString] = useState(() => {
    if (reminder?.reminderTime) {
      const time = new Date(reminder.reminderTime);
      return time.toTimeString().slice(0, 5); // HH:MM format
    }
    return '09:00'; // Default time
  });

  // Notification time states (when to send advance email)
  const [hasNotificationTime, setHasNotificationTime] = useState(!!reminder?.notificationTime);
  const [notificationTimeString, setNotificationTimeString] = useState(() => {
    if (reminder?.notificationTime) {
      const time = new Date(reminder.notificationTime);
      return time.toTimeString().slice(0, 5); // HH:MM format
    }
    return '18:00'; // Default notification time (6:00 PM)
  });

  // Update form state when reminder prop changes
  useEffect(() => {
    if (reminder) {
      setIsRecurring(reminder.isRecurring ?? false);
      setRecurrenceType(reminder.recurrenceType ?? "DAILY");
      setRecurrenceInterval(reminder.recurrenceInterval ?? 1);
      setPreDueNotifications(reminder.preDueNotifications ?? [1]);
      setTitle(reminder.title ?? '');
      setDescription(reminder.description ?? '');
      setDueDate(reminder.dueDate ?? new Date());
      setPriority(reminder.priority ?? 'MEDIUM');
      setCategory(reminder.category ?? '');
      setEmailNotification(reminder.emailNotification ?? true);
      setPushNotification(reminder.pushNotification ?? true);
      setHasSpecificTime(!!reminder.reminderTime);
      if (reminder.reminderTime) {
        const time = new Date(reminder.reminderTime);
        setTimeString(time.toTimeString().slice(0, 5));
      } else {
        setTimeString('09:00');
      }
      
      setHasNotificationTime(!!reminder.notificationTime);
      if (reminder.notificationTime) {
        const notifTime = new Date(reminder.notificationTime);
        setNotificationTimeString(notifTime.toTimeString().slice(0, 5));
      } else {
        setNotificationTimeString('18:00');
      }
    } else {
      // Reset form for new reminder
      setIsRecurring(false);
      setRecurrenceType("DAILY");
      setRecurrenceInterval(1);
      setPreDueNotifications([1]);
      setTitle('');
      setDescription('');
      setDueDate(new Date());
      setPriority('MEDIUM');
      setCategory('');
      setEmailNotification(true);
      setPushNotification(true);
      setHasSpecificTime(false);
      setTimeString('09:00');
      setHasNotificationTime(false);
      setNotificationTimeString('18:00');
    }
  }, [reminder]);

  // Helper functions for recurrence UI
  const getRecurrenceDisplayText = () => {
    if (!isRecurring) return 'Never';
    
    let baseText = '';
    switch (recurrenceType) {
      case 'DAILY':
        baseText = recurrenceInterval === 1 ? 'Daily' : `Every ${recurrenceInterval} days`;
        break;
      case 'WEEKLY':
        baseText = recurrenceInterval === 1 ? 'Weekly' : `Every ${recurrenceInterval} weeks`;
        break;
      case 'MONTHLY':
        baseText = recurrenceInterval === 1 ? 'Monthly' : `Every ${recurrenceInterval} months`;
        break;
      case 'CUSTOM':
        baseText = 'Custom';
        break;
      default:
        baseText = 'Daily';
    }
    
    return baseText;
  };

  const getIntervalUnit = () => {
    switch (recurrenceType) {
      case 'DAILY': return recurrenceInterval === 1 ? 'day' : 'days';
      case 'WEEKLY': return recurrenceInterval === 1 ? 'week' : 'weeks';
      case 'MONTHLY': return recurrenceInterval === 1 ? 'month' : 'months';
      case 'CUSTOM': return 'interval';
      default: return 'day';
    }
  };

  const togglePreDueNotification = (days: number) => {
    if (preDueNotifications.includes(days)) {
      setPreDueNotifications(preDueNotifications.filter(d => d !== days));
    } else {
      setPreDueNotifications([...preDueNotifications, days]);
    }
  };

  // Collaboration states
  const [enableCollaboration, setEnableCollaboration] = useState(false);
  const [collaborators, setCollaborators] = useState<Array<{
    email: string;
    role: 'VIEWER' | 'EDITOR' | 'ASSIGNEE' | 'MANAGER';
    message?: string;
  }>>([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [newCollaboratorRole, setNewCollaboratorRole] = useState<'VIEWER' | 'EDITOR' | 'ASSIGNEE' | 'MANAGER'>('VIEWER');
  const [collaborationMessage, setCollaborationMessage] = useState('');

  // Add collaborator function
  const addCollaborator = () => {
    if (!newCollaboratorEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCollaboratorEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if email already added
    if (collaborators.some(c => c.email.toLowerCase() === newCollaboratorEmail.trim().toLowerCase())) {
      toast.error('This email is already added');
      return;
    }

    setCollaborators([...collaborators, {
      email: newCollaboratorEmail.trim(),
      role: newCollaboratorRole,
      message: collaborationMessage.trim() || undefined
    }]);

    setNewCollaboratorEmail('');
    setCollaborationMessage('');
    toast.success('Collaborator added successfully');
  };

  // Remove collaborator function
  const removeCollaborator = (index: number) => {
    setCollaborators(collaborators.filter((_, i) => i !== index));
  };

  // Helper functions for role styling
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'EDITOR': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ASSIGNEE': return 'bg-green-100 text-green-800 border-green-300';
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'MANAGER': return <Crown className="h-3 w-3 mr-1" />;
      case 'EDITOR': return <Edit className="h-3 w-3 mr-1" />;
      case 'ASSIGNEE': return <Target className="h-3 w-3 mr-1" />;
      case 'VIEWER': return <Eye className="h-3 w-3 mr-1" />;
      default: return <Eye className="h-3 w-3 mr-1" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    // Combine date and time if specific time is set
    let finalReminderTime: Date | undefined = undefined;
    if (hasSpecificTime && timeString) {
      const timeParts = timeString.split(':');
      if (timeParts.length === 2 && timeParts[0] && timeParts[1]) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
          finalReminderTime = new Date(dueDate);
          finalReminderTime.setHours(hours, minutes, 0, 0);
        }
      }
    }

    // Combine date and notification time if set
    let finalNotificationTime: Date | undefined = undefined;
    if (hasNotificationTime && notificationTimeString) {
      const timeParts = notificationTimeString.split(':');
      if (timeParts.length === 2 && timeParts[0] && timeParts[1]) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
          finalNotificationTime = new Date(dueDate);
          finalNotificationTime.setHours(hours, minutes, 0, 0);
        }
      }
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate.toISOString(),
      priority,
      category: category.trim() || undefined,
      emailNotification,
      pushNotification,
      reminderTime: finalReminderTime?.toISOString(),
      notificationTime: finalNotificationTime?.toISOString(),
      autoAddToCalendar,
      collaborators: enableCollaboration ? collaborators : [],
      // Include recurring fields
      isRecurring,
      recurrenceType: isRecurring ? recurrenceType : undefined,
      recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
      preDueNotifications: isRecurring ? preDueNotifications : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1">
      {/* Recurrence Section - iOS Style */}
      <div className="space-y-4">
        {/* Repeat Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Repeat className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <Label htmlFor="is-recurring" className="text-base font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                Repeat
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {isRecurring ? getRecurrenceDisplayText() : 'Never'}
              </span>
              <Switch
                id="is-recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Recurrence Options - Show when enabled */}
        {isRecurring && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Recurrence Type Selection */}
            <div className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Repeat Frequency</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 'DAILY', label: 'Daily', icon: '📅' },
                    { value: 'WEEKLY', label: 'Weekly', icon: '📆' },
                    { value: 'MONTHLY', label: 'Monthly', icon: '🗓️' },
                    { value: 'CUSTOM', label: 'Custom', icon: '⚙️' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRecurrenceType(option.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM')}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        recurrenceType === option.value
                          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="text-lg mb-1">{option.icon}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interval Setting */}
            <div className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Every {recurrenceInterval} {getIntervalUnit()}
                  </Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRecurrenceInterval(Math.max(1, recurrenceInterval - 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium dark:text-gray-200">{recurrenceInterval}</span>
                    <button
                      type="button"
                      onClick={() => setRecurrenceInterval(recurrenceInterval + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Time Setting */}
            <div className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <Bell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Advance Notice Time</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">When to send &quot;reminder coming up&quot; email</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={notificationTimeString}
                        onChange={(e) => setNotificationTimeString(e.target.value)}
                        className="w-32 text-center"
                        disabled={!hasNotificationTime}
                      />
                    </div>
                    <Switch
                      checked={hasNotificationTime}
                      onCheckedChange={setHasNotificationTime}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                </div>
                {hasNotificationTime && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400 text-right">
                    Will send advance email at {notificationTimeString}
                  </div>
                )}
                {!hasNotificationTime && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
                    No advance notification
                  </div>
                )}
              </div>
            </div>

            {/* Pre-Due Notifications */}
            <div>
              <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Early Reminders</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Get notified before the due date</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[1, 2, 3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => togglePreDueNotification(days)}
                      className={`p-2 rounded-lg border text-center transition-all text-sm ${
                        preDueNotifications.includes(days)
                          ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {days} day{days > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {preDueNotifications.length > 0 
                    ? `Selected: ${preDueNotifications.sort((a, b) => a - b).join(', ')} days before`
                    : 'No early reminders selected'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter reminder title"
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add description (optional)"
          className="mt-1 min-h-[80px]"
          rows={3}
        />
      </div>

      <div>
        <Label className="text-sm font-medium">Due Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-start text-left font-normal mt-1"
              type="button"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDate(dueDate)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={(date) => date && setDueDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="specific-time" className="text-sm font-medium">Set Specific Time</Label>
          <Switch
            id="specific-time"
            checked={hasSpecificTime}
            onCheckedChange={setHasSpecificTime}
          />
        </div>
        {hasSpecificTime && (
          <div>
            <Label htmlFor="reminder-time" className="text-sm font-medium">Reminder Time</Label>
            <Input
              id="reminder-time"
              type="time"
              value={timeString}
              onChange={(e) => setTimeString(e.target.value)}
              className="w-full mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Set the specific time for this reminder
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Priority</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}>
            <SelectTrigger className="mt-1">
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

        <div>
          <Label htmlFor="category" className="text-sm font-medium">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Work, Personal"
            className="mt-1"
          />
        </div>
      </div>

      <div className="space-y-3 bg-muted/30 p-3 rounded-lg">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notification" className="text-sm font-medium">Email Notifications</Label>
          <Switch
            id="email-notification"
            checked={emailNotification}
            onCheckedChange={setEmailNotification}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="push-notification" className="text-sm font-medium">Push Notifications</Label>
          <Switch
            id="push-notification"
            checked={pushNotification}
            onCheckedChange={setPushNotification}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-calendar" className="text-sm font-medium">📅 Add to Calendar</Label>
          <Switch
            id="auto-calendar"
            checked={autoAddToCalendar}
            onCheckedChange={setAutoAddToCalendar}
          />
        </div>
      </div>

      {/* Collaboration Section */}
      <div className="space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200/60 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <Label htmlFor="enable-collaboration" className="text-sm font-semibold text-gray-900">
                Team Collaboration
              </Label>
              <p className="text-xs text-gray-600 mt-0.5">Share and assign this reminder to team members</p>
            </div>
          </div>
          <Switch
            id="enable-collaboration"
            checked={enableCollaboration}
            onCheckedChange={setEnableCollaboration}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
        
        {enableCollaboration && (
          <div className="space-y-5 animate-in fade-in-0 duration-300">
            
            {/* Add Collaborator Form */}
            <div className="space-y-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <UserPlus className="h-4 w-4 text-gray-600" />
                <h4 className="font-medium text-gray-900">Add Team Member</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collaborator-email" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input
                    id="collaborator-email"
                    type="email"
                    placeholder="teammate@company.com"
                    value={newCollaboratorEmail}
                    onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                    className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collaborator-role" className="text-sm font-medium text-gray-700">Role & Permissions</Label>
                  <Select value={newCollaboratorRole} onValueChange={(value) => setNewCollaboratorRole(value as 'VIEWER' | 'EDITOR' | 'ASSIGNEE' | 'MANAGER')}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIEWER">
                        <div className="flex items-center gap-3 py-1">
                          <div className="p-1 bg-gray-100 rounded">
                            <Eye className="h-3 w-3 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium">Viewer</div>
                            <div className="text-xs text-gray-500">Can view only</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="EDITOR">
                        <div className="flex items-center gap-3 py-1">
                          <div className="p-1 bg-blue-100 rounded">
                            <Edit className="h-3 w-3 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">Editor</div>
                            <div className="text-xs text-gray-500">Can edit details</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="ASSIGNEE">
                        <div className="flex items-center gap-3 py-1">
                          <div className="p-1 bg-green-100 rounded">
                            <Target className="h-3 w-3 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">Assignee</div>
                            <div className="text-xs text-gray-500">Responsible for completion</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="MANAGER">
                        <div className="flex items-center gap-3 py-1">
                          <div className="p-1 bg-purple-100 rounded">
                            <Crown className="h-3 w-3 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium">Manager</div>
                            <div className="text-xs text-gray-500">Full control & sharing</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="collaboration-message" className="text-sm font-medium text-gray-700">Personal Message</Label>
                <Textarea
                  id="collaboration-message"
                  placeholder="Add a note about why you're sharing this reminder..."
                  value={collaborationMessage}
                  onChange={(e) => setCollaborationMessage(e.target.value)}
                  className="border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 min-h-[70px]"
                  rows={3}
                />
              </div>
              
              <Button 
                type="button" 
                onClick={addCollaborator}
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                disabled={!newCollaboratorEmail.trim()}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </div>

            {/* Collaborators List */}
            {collaborators.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-medium text-gray-900">
                    Team Members ({collaborators.length})
                  </Label>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {collaborators.map((collaborator, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <Mail className="h-3 w-3 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 truncate text-sm">{collaborator.email}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-medium ${getRoleColor(collaborator.role)}`}
                            >
                              {getRoleIcon(collaborator.role)}
                              {collaborator.role}
                            </Badge>
                          </div>
                          {collaborator.message && (
                            <p className="text-xs text-gray-600 truncate">
                              &quot;{collaborator.message}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCollaborator(index)}
                        className="ml-3 h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="w-full sm:flex-1 font-medium"
        >
          {reminder ? 'Update' : 'Create'} Reminder
        </Button>
      </div>
    </form>
  );
}
