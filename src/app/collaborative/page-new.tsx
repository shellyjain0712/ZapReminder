'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Share2, Users, Clock, CheckCircle, AlertCircle, Mail, UserPlus, Gift, Crown, Target, Eye, Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  isCompleted: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
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
      const response = await fetch('/api/reminders/collaborative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reminderId: selectedReminder.id,
          email: shareEmail.trim(),
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'EDITOR': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ASSIGNEE': return 'bg-green-100 text-green-800 border-green-200';
      case 'VIEWER': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Collaborative Reminders
          </h1>
          <p className="text-muted-foreground mt-2">
            Share reminders with friends and family, assign tasks, and collaborate effectively.
          </p>
        </div>
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
                    Create Reminder
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
                                      {(reminder.sharedBy.name?.[0] || reminder.sharedBy.email[0]).toUpperCase()}
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
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending invitations</h3>
                  <p className="text-muted-foreground">Collaboration invitations will appear here when you receive them.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingInvitations.map((invitation) => (
                    <Card key={invitation.id} className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{invitation.reminder.title}</h3>
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {invitation.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{invitation.message}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <UserPlus className="h-3 w-3" />
                              <span>From {invitation.inviter.name || invitation.inviter.email}</span>
                              <span>•</span>
                              <span>{formatDate(invitation.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                              Decline
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Accept
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
