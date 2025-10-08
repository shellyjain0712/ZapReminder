/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-floating-promises */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Share2, Users, Clock, CheckCircle, AlertCircle, Mail, UserPlus, Gift, Crown, Target, Eye, Edit, Plus, MoreVertical, Info, Calendar, Bell, Repeat } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReminderForm } from '@/components/Reminders';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { addReminderToCalendar } from '@/lib/calendar-integration';

interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  isCompleted: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  emailNotification: boolean;
  pushNotification: boolean;
  whatsappNotification: boolean;
  reminderTime?: Date;
  notificationTime?: Date; // When to send advance notification email
  reminderInterval?: number; // Reminder interval in minutes
  lastNotificationSent?: Date; // Track when last notification was sent
  isSnooze: boolean;
  snoozeUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Recurring reminder fields
  isRecurring?: boolean;
  recurrenceType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  recurrenceInterval?: number;
  preDueNotifications?: number[];
  // Collaborative fields
  user?: {
    name?: string;
    email: string;
    image?: string;
  };
  sharedBy?: {
    name?: string;
    email: string;
    image?: string;
  };
  role?: string;
  sharedAt?: Date;
}

interface Invitation {
  id: string;
  type: string;
  message: string;
  inviter: {
    name?: string;
    email: string;
  };
  reminder: {
    title: string;
  };
  createdAt: Date;
}

export default function CollaborativePage() {
  const { data: session } = useSession();
  const [myReminders, setMyReminders] = useState<Reminder[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<Reminder[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Share dialog state
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'VIEWER' | 'EDITOR' | 'ASSIGNEE' | 'MANAGER'>('VIEWER');
  const [shareMessage, setShareMessage] = useState('');
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Create reminder dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Edit shared reminder state
  const [editingSharedReminder, setEditingSharedReminder] = useState<Reminder | null>(null);
  
  // Detail view state
  const [viewingReminderDetails, setViewingReminderDetails] = useState<Reminder | null>(null);

  // Process reminder data to convert date strings to Date objects
  const processReminderData = (reminders: any[]): Reminder[] => {
    return reminders.map(reminder => ({
      ...reminder,
      dueDate: reminder.dueDate ? new Date(reminder.dueDate) : undefined,
      reminderTime: reminder.reminderTime ? new Date(reminder.reminderTime) : undefined,
      notificationTime: reminder.notificationTime ? new Date(reminder.notificationTime) : undefined,
      createdAt: reminder.createdAt ? new Date(reminder.createdAt) : new Date(),
      updatedAt: reminder.updatedAt ? new Date(reminder.updatedAt) : new Date(),
      sharedAt: reminder.sharedAt ? new Date(reminder.sharedAt) : undefined,
      snoozeUntil: reminder.snoozeUntil ? new Date(reminder.snoozeUntil) : undefined,
      lastNotificationSent: reminder.lastNotificationSent ? new Date(reminder.lastNotificationSent) : undefined,
    }));
  };

  // Process invitation data to convert date strings to Date objects
  const processInvitationData = (invitations: any[]): Invitation[] => {
    return invitations.map(invitation => ({
      ...invitation,
      createdAt: invitation.createdAt ? new Date(invitation.createdAt) : new Date(),
    }));
  };

  // Fetch collaborative data
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/reminders/collaborative');
      const data = await response.json();
      
      if (data.success) {
        setMyReminders(processReminderData(data.myReminders || []));
        setSharedWithMe(processReminderData(data.sharedWithMe || []));
        setPendingInvitations(processInvitationData(data.pendingInvitations || []));
      } else {
        toast.error(data.error || 'Failed to fetch collaborative data');
      }
    } catch (error) {
      console.error('Error fetching collaborative data:', error);
      toast.error('Failed to fetch collaborative data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session, fetchData]);

  const handleShare = async () => {
    if (!selectedReminder || !shareEmail.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSharing(true);
    try {
      const response = await fetch('/api/reminders/collaborative/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reminderId: selectedReminder.id,
          recipientEmail: shareEmail.trim(),
          role: shareRole,
          message: shareMessage.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Reminder shared successfully! 🎉');
        setIsShareDialogOpen(false);
        setShareEmail('');
        setShareMessage('');
        setSelectedReminder(null);
        fetchData(); // Refresh data
      } else {
        toast.error(data.error || 'Failed to share reminder');
      }
    } catch (error) {
      console.error('Error sharing reminder:', error);
      toast.error('Failed to share reminder');
    } finally {
      setIsSharing(false);
    }
  };

  const handleInvitationResponse = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch('/api/collaborations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collaborationId: invitationId,
          action,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          action === 'accept' 
            ? '✅ Invitation accepted! The reminder has been added to your shared list.' 
            : '❌ Invitation declined.'
        );
        fetchData(); // Refresh data to update the UI
      } else {
        toast.error(data.error || `Failed to ${action} invitation`);
      }
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
      toast.error(`Failed to ${action} invitation`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-rose-400 dark:bg-rose-500 text-white';
      case 'HIGH': return 'bg-rose-500 dark:bg-rose-600 text-white';
      case 'MEDIUM': return 'bg-yellow-500 dark:bg-yellow-600 text-black dark:text-white';
      case 'LOW': return 'bg-green-500 dark:bg-green-600 text-white';
      default: return 'bg-gray-500 dark:bg-gray-600 text-white';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700';
      case 'EDITOR': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700';
      case 'ASSIGNEE': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
      case 'VIEWER': return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'MANAGER': return <Crown className="h-3 w-3" />;
      case 'EDITOR': return <Edit className="h-3 w-3" />;
      case 'ASSIGNEE': return <Target className="h-3 w-3" />;
      case 'VIEWER': return <Eye className="h-3 w-3" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'Not set';
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Check if user can edit a shared reminder based on their role
  const canEditSharedReminder = (reminder: Reminder) => {
    return reminder.role === 'EDITOR' || reminder.role === 'MANAGER';
  };

  // Convert shared reminder to form-compatible format
  const convertToFormReminder = (sharedReminder: Reminder) => {
    return {
      ...sharedReminder,
      dueDate: sharedReminder.dueDate || new Date(),
      reminderTime: sharedReminder.reminderTime || undefined,
      notificationTime: sharedReminder.notificationTime || undefined,
    };
  };

  // Handle editing a shared reminder
  const handleEditSharedReminder = async (reminderData: {
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
  }) => {
    if (!editingSharedReminder) return;
    
    try {
      // Convert string dates to Date objects for the API
      const apiData = {
        ...reminderData,
        dueDate: new Date(reminderData.dueDate),
        reminderTime: reminderData.reminderTime ? new Date(reminderData.reminderTime) : undefined,
        notificationTime: reminderData.notificationTime ? new Date(reminderData.notificationTime) : undefined,
      };

      const response = await fetch(`/api/reminders/${editingSharedReminder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        await fetchData(); // Refresh the data
        setEditingSharedReminder(null);
        toast.success('Reminder updated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update reminder');
      }
    } catch (error) {
      console.error('Error updating shared reminder:', error);
      toast.error('Failed to update reminder');
    }
  };

  // Handle completing/uncompleting a shared reminder
  const handleToggleSharedComplete = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: completed }),
      });

      if (response.ok) {
        await fetchData(); // Refresh the data
        toast.success(completed ? 'Reminder completed!' : 'Reminder marked as incomplete');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update reminder');
      }
    } catch (error) {
      console.error('Error toggling reminder completion:', error);
      toast.error('Failed to update reminder');
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-muted-foreground">Please sign in to access collaborative features.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p>Loading collaborative features...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Collaborative Reminders
          </h1>
          <p className="text-muted-foreground mt-2">
            Share reminders with friends and family, assign tasks, and collaborate effectively.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Share2 className="h-3 w-3" />
              {myReminders.length} My Reminders
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Gift className="h-3 w-3" />
              {sharedWithMe.length} Shared With Me
            </Badge>
            {pendingInvitations.length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {pendingInvitations.length} Pending
              </Badge>
            )}
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="default"
                className="w-full  sm:w-auto font-medium bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 shadow-sm hover:shadow-md transition-all duration-200">
                <Plus className="size-4  mr-2" />
                Create Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Create New Collaborative Reminder</DialogTitle>
                <DialogDescription>
                  Create a new reminder and optionally share it with team members. Perfect for collaborative tasks and team coordination.
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
                      await fetchData(); // Refresh collaborative data
                      setIsCreateDialogOpen(false);
                      
                      // Show success message with collaboration info
                      if (hasCollaborators) {
                        toast.success(`🎉 Collaborative reminder created and shared with ${data.collaborators!.length} team member(s)!`, {
                          description: 'Invitation emails have been sent. Perfect for team coordination!',
                          duration: 4000,
                        });
                      } else {
                        toast.success('✅ Reminder created successfully! Share it with team members anytime.');
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
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Share2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">My Reminders</p>
                <p className="text-2xl font-bold text-blue-900">{myReminders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Gift className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Shared With Me</p>
                <p className="text-2xl font-bold text-green-900">{sharedWithMe.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700">Collaborators</p>
                <p className="text-2xl font-bold text-purple-900">
                  {new Set([...myReminders, ...sharedWithMe].map(r => r.user?.email || r.sharedBy?.email)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="my-reminders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-reminders" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            My Reminders ({myReminders.length})
          </TabsTrigger>
          <TabsTrigger value="shared-with-me" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Shared With Me ({sharedWithMe.length})
          </TabsTrigger>
          <TabsTrigger value="collaborations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invitations ({pendingInvitations.length})
          </TabsTrigger>
        </TabsList>

        {/* My Reminders Tab */}
        <TabsContent value="my-reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                My Reminders
              </CardTitle>
              <CardDescription>
                Share your reminders with others and assign tasks to family or friends.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myReminders.length === 0 ? (
                <div className="text-center py-12">
                  <Share2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reminders yet</h3>
                  <p className="text-muted-foreground mb-4">Create a reminder first to start collaborating.</p>
                  <Button onClick={() => window.location.href = '/dashboard'} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    {/* Create Reminder */}
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myReminders.map((reminder) => (
                    <Card 
                      key={reminder.id} 
                      className="border-l-4 border-l-primary hover:shadow-lg hover:border-l-6 transition-all duration-200 cursor-pointer group"
                      onClick={() => setViewingReminderDetails(reminder)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{reminder.title}</h3>
                              <div title="Click to view details">
                                <Info className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <Badge className={getPriorityColor(reminder.priority)}>
                                {reminder.priority}
                              </Badge>
                              {reminder.isCompleted && (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                            {reminder.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{reminder.description}</p>
                            )}
                            {reminder.dueDate && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Due: {formatDate(reminder.dueDate)}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReminder(reminder);
                              setIsShareDialogOpen(true);
                            }}
                            className="flex items-center gap-1 hover:bg-primary hover:text-primary-foreground"
                          >
                            <Share2 className="h-3 w-3" />
                            Share
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shared With Me Tab */}
        <TabsContent value="shared-with-me" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Shared With Me
              </CardTitle>
              <CardDescription>
                Reminders that others have shared with you and tasks assigned to you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sharedWithMe.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No shared reminders</h3>
                  <p className="text-muted-foreground">When others share reminders with you, they&apos;ll appear here.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sharedWithMe.map((reminder) => (
                    <Card 
                      key={reminder.id} 
                      className="border-l-4 border-l-blue-500 hover:shadow-lg hover:border-l-6 transition-all duration-200 cursor-pointer group"
                      onClick={() => setViewingReminderDetails(reminder)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{reminder.title}</h3>
                              <div title="Click to view details">
                                <Info className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <Badge className={getPriorityColor(reminder.priority)}>
                                {reminder.priority}
                              </Badge>
                              {reminder.role && (
                                <Badge variant="outline" className={getRoleColor(reminder.role)}>
                                  {getRoleIcon(reminder.role)}
                                  <span className="ml-1">{reminder.role}</span>
                                </Badge>
                              )}
                              {reminder.isCompleted && (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                            {reminder.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{reminder.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {reminder.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Due: {formatDate(reminder.dueDate)}
                                </div>
                              )}
                              {reminder.sharedBy && (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={reminder.sharedBy.image} />
                                    <AvatarFallback className="text-xs">
                                      {(reminder.sharedBy?.name?.[0] ?? reminder.sharedBy?.email?.[0] ?? 'U').toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>Shared by {reminder.sharedBy.name || reminder.sharedBy.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions Dropdown for Shared Reminders */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {canEditSharedReminder(reminder) && (
                                <DropdownMenuItem onClick={() => setEditingSharedReminder(reminder)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Reminder
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleToggleSharedComplete(reminder.id, !reminder.isCompleted)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {reminder.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collaborations Tab */}
        <TabsContent value="collaborations" className="space-y-4">
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                Collaboration Invitations
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Pending invitations and collaboration requests from other users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <Mail className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">No pending invitations</h3>
                  <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    When someone shares a reminder with you, collaboration invitations will appear here. 
                    You&apos;ll be able to accept or decline them easily.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingInvitations.map((invitation) => (
                    <Card key={invitation.id} className="border border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-blue-50/50 to-white relative overflow-hidden">
                      {/* Top accent bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
                      
                      <CardContent className="pt-6 pb-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                          <div className="flex-1 space-y-3">
                            {/* Header with title and badge */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 rounded-full">
                                  <Mail className="h-4 w-4 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-lg text-gray-900 truncate">{invitation.reminder.title}</h3>
                              </div>
                              <Badge variant="secondary" className="text-blue-700 bg-blue-100 border-blue-200 px-2.5 py-1 text-xs font-medium w-fit">
                                <Share2 className="h-3 w-3 mr-1" />
                                {invitation.type}
                              </Badge>
                            </div>

                            {/* Message */}
                            {invitation.message && (
                              <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-100">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  &quot;{invitation.message}&quot;
                                </p>
                              </div>
                            )}

                            {/* User info */}
                            <div className="flex items-center gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 ring-2 ring-blue-100">
                                  <AvatarFallback className="text-xs bg-blue-500 text-white font-medium">
                                    {invitation.inviter.name?.[0]?.toUpperCase() || invitation.inviter.email[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-gray-700">
                                  {invitation.inviter.name || invitation.inviter.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-500">
                                <span>•</span>
                                <Clock className="h-3.5 w-3.5" />
                                <span className="text-xs">{formatDate(invitation.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-row sm:flex-col gap-2 sm:gap-2 shrink-0">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2 font-medium flex-1 sm:flex-none"
                              onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 border-gray-300 text-gray-600 transition-all duration-200 px-4 py-2 font-medium flex-1 sm:flex-none"
                              onClick={() => handleInvitationResponse(invitation.id, 'decline')}
                            >
                              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Reminder
            </DialogTitle>
            <DialogDescription>
              Share &quot;{selectedReminder?.title}&quot; with someone and assign them a role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={shareRole} onValueChange={(value: 'VIEWER' | 'EDITOR' | 'ASSIGNEE' | 'MANAGER') => setShareRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEWER">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Viewer</span>
                        <span className="text-xs text-muted-foreground">Can view the reminder</span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="EDITOR">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Editor</span>
                        <span className="text-xs text-muted-foreground">Can view and edit the reminder</span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="ASSIGNEE">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Assignee</span>
                        <span className="text-xs text-muted-foreground">Responsible for completing the task</span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="MANAGER">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">Manager</span>
                        <span className="text-xs text-muted-foreground">Can manage and share with others</span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Input
                id="message"
                placeholder="Add a personal message..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsShareDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleShare}
                disabled={isSharing || !shareEmail.trim()}
              >
                {isSharing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Sharing...
                  </div>
                ) : (
                  <>
                    <Share2 className="h-3 w-3 mr-1" />
                    Share
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Shared Reminder Dialog */}
      <Dialog open={!!editingSharedReminder} onOpenChange={() => setEditingSharedReminder(null)}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Shared Reminder</DialogTitle>
            <DialogDescription>
              You have {editingSharedReminder?.role} permissions for this reminder. 
              {editingSharedReminder?.role === 'EDITOR' ? ' You can edit all reminder details.' : ''}
              {editingSharedReminder?.role === 'MANAGER' ? ' You have full management permissions.' : ''}
            </DialogDescription>
          </DialogHeader>
          {editingSharedReminder && (
            <ReminderForm
              reminder={editingSharedReminder ? convertToFormReminder(editingSharedReminder) : undefined}
              onSubmit={handleEditSharedReminder}
              onCancel={() => setEditingSharedReminder(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Reminder Details Dialog */}
      <Dialog open={!!viewingReminderDetails} onOpenChange={() => setViewingReminderDetails(null)}>
        <DialogContent className="w-[95vw] max-w-4xl mx-auto max-h-[95vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl text-gray-900 dark:text-white">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6 px-1">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
              {viewingReminderDetails?.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 text-base">
              Detailed information about this reminder
            </DialogDescription>
          </DialogHeader>
          
          {viewingReminderDetails && (
            <div className="space-y-6">
              {/* Status and Priority Row */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2">Status</h4>
                  {viewingReminderDetails.isCompleted ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/50">
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/50">
                      Pending
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2">Priority</h4>
                  <Badge className={getPriorityColor(viewingReminderDetails.priority)} variant="default">
                    {viewingReminderDetails.priority}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              {viewingReminderDetails.description && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2">Description</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                    <p className="text-sm text-gray-900 dark:text-gray-200">
                      {viewingReminderDetails.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Due Date and Category Row */}
              <div className="grid grid-cols-2 gap-6">
                {viewingReminderDetails.dueDate && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2">Due Date</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-200">
                      <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      {formatDate(viewingReminderDetails.dueDate)}
                    </div>
                  </div>
                )}
                {viewingReminderDetails.category && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2">Category</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600">
                      {viewingReminderDetails.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Reminder Time */}
              {viewingReminderDetails.reminderTime && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2">Reminder Time</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-200">
                    <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    {formatDate(viewingReminderDetails.reminderTime)}
                  </div>
                </div>
              )}

              {/* Notification Preferences */}
              <div>
                <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notification Preferences
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-gray-200">Email Notifications</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      viewingReminderDetails.emailNotification 
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/50' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600'
                    }`}>
                      {viewingReminderDetails.emailNotification ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-gray-200">Push Notifications</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      viewingReminderDetails.pushNotification 
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/50' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600'
                    }`}>
                      {viewingReminderDetails.pushNotification ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collaboration */}
              {viewingReminderDetails.role && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Collaboration
                  </h4>
                  <div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-md">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                        <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-200">Your Role</div>
                        <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                          {viewingReminderDetails.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-3">Timeline</h4>
                <div className="space-y-3">
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-200">Created:</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(viewingReminderDetails.createdAt)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-200">Last Updated:</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(viewingReminderDetails.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  onClick={() => setViewingReminderDetails(null)}
                  className="w-full sm:flex-1 h-11 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-transparent"
                >
                  Close
                </Button>
                {viewingReminderDetails.role && (viewingReminderDetails.role === 'EDITOR' || viewingReminderDetails.role === 'MANAGER') && (
                  <Button 
                    onClick={() => {
                      setEditingSharedReminder(viewingReminderDetails);
                      setViewingReminderDetails(null);
                    }}
                    className="w-full sm:flex-1 gap-2 h-11 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Reminder
                  </Button>
                )}
                {(!viewingReminderDetails.role || viewingReminderDetails.user) && (
                  <Button 
                    onClick={() => {
                      setSelectedReminder(viewingReminderDetails);
                      setViewingReminderDetails(null);
                      setIsShareDialogOpen(true);
                    }}
                    variant="outline"
                    className="w-full sm:flex-1 gap-2 h-11 border-blue-300 dark:border-blue-500/50 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 bg-white dark:bg-transparent"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
