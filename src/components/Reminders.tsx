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
import { CalendarIcon, Plus, Users, Eye, Edit, Target, Crown, UserPlus, X, Mail } from 'lucide-react';
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
    autoAddToCalendar?: boolean;
    collaborators?: Array<{
      email: string;
      role: 'VIEWER' | 'EDITOR' | 'ASSIGNEE' | 'MANAGER';
      message?: string;
    }>;
  }) => void;
  onCancel: () => void;
}

export function ReminderForm({ reminder, onSubmit, onCancel }: ReminderFormProps) {
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
      collaborators: enableCollaboration ? collaborators : [],
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
