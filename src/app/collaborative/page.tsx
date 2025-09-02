/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-floating-promises */
'use client';

import { useState, useEffect } from 'react';
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
import { Share2, Users, Clock, CheckCircle, AlertCircle, Mail, UserPlus, Gift, Crown, Target, Eye, Edit, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReminderForm } from '@/components/Reminders';
import { addReminderToCalendar } from '@/lib/calendar-integration';

interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  isCompleted: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notificationTime?: Date; // When to send advance notification email
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

  // Fetch collaborative data
  const fetchData = async () => {
    try {
      const response = await fetch('/api/reminders/collaborative');
      const data = await response.json();
      
      if (data.success) {
        setMyReminders(data.myReminders || []);
        setSharedWithMe(data.sharedWithMe || []);
        setPendingInvitations(data.pendingInvitations || []);
      } else {
        toast.error(data.error || 'Failed to fetch collaborative data');
      }
    } catch (error) {
      console.error('Error fetching collaborative data:', error);
      toast.error('Failed to fetch collaborative data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

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
      case 'HIGH': return 'bg-orange-500 dark:bg-orange-600 text-white';
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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
                    <Card key={reminder.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{reminder.title}</h3>
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
                            onClick={() => {
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
                    <Card key={reminder.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{reminder.title}</h3>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Collaboration Invitations
              </CardTitle>
              <CardDescription>
                Pending invitations and collaboration requests from other users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">No pending invitations</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    When someone shares a reminder with you, collaboration invitations will appear here. 
                    You&apos;ll be able to accept or decline them easily.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingInvitations.map((invitation) => (
                    <Card key={invitation.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-blue-50/30 to-white">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <h3 className="font-semibold text-lg text-gray-900">{invitation.reminder.title}</h3>
                              <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {invitation.type}
                              </Badge>
                            </div>
                            {invitation.message && (
                              <div className="mb-3 p-3 bg-gray-50 rounded-lg border-l-2 border-blue-300">
                                <p className="text-sm text-gray-700 italic">
                                  &quot;{invitation.message}&quot;
                                </p>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                  {invitation.inviter.name?.[0] || invitation.inviter.email[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">From {invitation.inviter.name || invitation.inviter.email}</span>
                              <span>•</span>
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(invitation.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all"
                              onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 dark:hover:border-rose-700 transition-all"
                              onClick={() => handleInvitationResponse(invitation.id, 'decline')}
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
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
    </div>
  );
}
