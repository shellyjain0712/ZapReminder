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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Plus } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
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
  isSnooze: boolean;
  snoozeUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
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
          completed: boolean;
          emailNotification?: boolean;
          pushNotification?: boolean;
          reminderTime?: string;
          snoozeUntil?: string;
          userId: string;
          createdAt: string;
          updatedAt: string;
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
        await fetchReminders();
        toast.success('Task deleted successfully');
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
              className="w-full sm:w-auto font-medium shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Create New Reminder</DialogTitle>
              <DialogDescription>
                Fill out the form below to create a new reminder. Set a title, description, date, and time for your reminder.
              </DialogDescription>
            </DialogHeader>
            <ReminderForm
              onSubmit={async (data) => {
                try {
                  const response = await fetch('/api/reminders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  });

                  if (response.ok) {
                    await response.json();
                    await fetchReminders();
                    setShowAddDialog(false);
                    
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
                          toast.success('Reminder created successfully');
                          toast.warning('Calendar integration failed - you can manually add it later');
                        }
                      } catch (calendarError) {
                        console.error('Error with calendar integration:', calendarError);
                        toast.success('Reminder created successfully');
                        toast.info('Manual calendar addition: Use the dropdown menu on the reminder card');
                      }
                    } else {
                      // User chose not to add to calendar
                      toast.success('Reminder created successfully');
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
                Update the details of your reminder. Modify the title, description, date, or time as needed.
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
    </div>
  );
}

interface ReminderFormProps {
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
    autoAddToCalendar?: boolean;
  }) => void;
  onCancel: () => void;
}

function ReminderForm({ reminder, onSubmit, onCancel }: ReminderFormProps) {
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

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate.toISOString(),
      priority,
      category: category.trim() || undefined,
      emailNotification,
      pushNotification,
      reminderTime: finalReminderTime?.toISOString(),
      autoAddToCalendar,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1">
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
