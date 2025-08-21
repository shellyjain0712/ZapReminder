'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Users, 
  Share, 
  UserPlus, 
  Send, 
  Clock, 
  CheckCircle, 
  Calendar,
  Mail,
  Plus,
  Eye,
  Edit,
  Target,
  Crown,
  AlertCircle
} from 'lucide-react';

interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
}

interface CollaborativeData {
  reminders: Reminder[];
  message: string;
}

export default function CollaborativeRemindersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<CollaborativeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'VIEWER' | 'EDITOR' | 'ASSIGNEE' | 'MANAGER'>('VIEWER');
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    void fetchCollaborativeReminders();
  }, [session, status, router]);

  const fetchCollaborativeReminders = async () => {
    try {
      const response = await fetch('/api/reminders/collaborative');
      if (!response.ok) throw new Error('Failed to fetch');
      
      const result = await response.json() as CollaborativeData;
      setData(result);
    } catch (error) {
      console.error('Error fetching collaborative reminders:', error);
      toast.error('Failed to load collaborative reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleShareReminder = async () => {
    if (!selectedReminder || !shareEmail.trim()) {
      toast.error('Please select a reminder and enter an email address');
      return;
    }

    try {
      const response = await fetch('/api/reminders/collaborative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'share',
          reminderId: selectedReminder.id,
          userEmail: shareEmail.trim(),
          role: shareRole,
          message: shareMessage.trim()
        })
      });

      if (!response.ok) throw new Error('Failed to share reminder');
      
      const result = await response.json() as { success: boolean; message: string };
      toast.success(result.message || 'Reminder shared successfully');
      
      setShareDialogOpen(false);
      setShareEmail('');
      setShareMessage('');
      setSelectedReminder(null);
      
      // Refresh data
      await fetchCollaborativeReminders();
    } catch (error) {
      console.error('Error sharing reminder:', error);
      toast.error('Failed to share reminder');
    }
  };

  // Remove unused functions for now
  // const getRoleIcon = (role: string) => {
  //   switch (role) {
  //     case 'VIEWER': return <Eye className="h-4 w-4" />;
  //     case 'EDITOR': return <Edit className="h-4 w-4" />;
  //     case 'ASSIGNEE': return <Target className="h-4 w-4" />;
  //     case 'MANAGER': return <Crown className="h-4 w-4" />;
  //     default: return <Eye className="h-4 w-4" />;
  //   }
  // };

  // const getRoleDescription = (role: string) => {
  //   switch (role) {
  //     case 'VIEWER': return 'Can view the reminder';
  //     case 'EDITOR': return 'Can view and edit the reminder';
  //     case 'ASSIGNEE': return 'Responsible for completing the reminder';
  //     case 'MANAGER': return 'Can manage sharing and permissions';
  //     default: return 'Can view the reminder';
  //   }
  // };

  const getPriorityColor = (priority: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (priority) {
      case 'URGENT': return 'destructive';
      case 'HIGH': return 'default';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'secondary';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Collaborative Reminders
          </h1>
          <p className="text-muted-foreground mt-2">
            Share reminders with friends and family, assign tasks, and collaborate on important events
          </p>
        </div>
      </div>

      {/* Feature Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Coming Soon: Full Collaborative Features
          </CardTitle>
          <CardDescription>
            We&apos;re building powerful collaboration features including:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Share className="h-4 w-4" />
                Sharing & Permissions
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Share reminders with specific users</li>
                <li>• Set different permission levels (View, Edit, Assign, Manage)</li>
                <li>• Send collaboration invitations via email</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Team Collaboration
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Assign reminders to family members</li>
                <li>• Track completion by different users</li>
                <li>• Real-time collaboration updates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="my-reminders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-reminders">My Reminders</TabsTrigger>
          <TabsTrigger value="shared-with-me">Shared With Me</TabsTrigger>
          <TabsTrigger value="collaborations">Collaborations</TabsTrigger>
        </TabsList>

        <TabsContent value="my-reminders" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Reminders</h2>
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Share Reminder
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Reminder</DialogTitle>
                  <DialogDescription>
                    Choose a reminder to share and set permissions for the recipient.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Reminder</Label>
                    <Select onValueChange={(value) => {
                      const reminder = data?.reminders.find(r => r.id === value);
                      setSelectedReminder(reminder ?? null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a reminder to share" />
                      </SelectTrigger>
                      <SelectContent>
                        {data?.reminders.map((reminder) => (
                          <SelectItem key={reminder.id} value={reminder.id}>
                            {reminder.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Recipient Email</Label>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Permission Level</Label>
                    <Select value={shareRole} onValueChange={(value: 'VIEWER' | 'EDITOR' | 'ASSIGNEE' | 'MANAGER') => setShareRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEWER">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <div>
                              <div>Viewer</div>
                              <div className="text-xs text-muted-foreground">Can view only</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="EDITOR">
                          <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            <div>
                              <div>Editor</div>
                              <div className="text-xs text-muted-foreground">Can view and edit</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="ASSIGNEE">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            <div>
                              <div>Assignee</div>
                              <div className="text-xs text-muted-foreground">Responsible for completion</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="MANAGER">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4" />
                            <div>
                              <div>Manager</div>
                              <div className="text-xs text-muted-foreground">Can manage sharing</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Message (Optional)</Label>
                    <Input
                      placeholder="Add a personal message..."
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShareDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleShareReminder}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {data?.reminders.map((reminder) => (
              <Card key={reminder.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{reminder.title}</h3>
                        <Badge variant={getPriorityColor(reminder.priority)}>
                          {reminder.priority}
                        </Badge>
                        {reminder.isCompleted && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      {reminder.description && (
                        <p className="text-sm text-muted-foreground">{reminder.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(reminder.dueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(reminder.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReminder(reminder);
                        setShareDialogOpen(true);
                      }}
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {data?.reminders.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reminders Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create some reminders in your dashboard to start collaborating with others.
                </p>
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="shared-with-me" className="space-y-4">
          <h2 className="text-xl font-semibold">Reminders Shared With You</h2>
          <Card>
            <CardContent className="p-8 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Shared Reminders</h3>
              <p className="text-muted-foreground">
                When others share reminders with you, they&apos;ll appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collaborations" className="space-y-4">
          <h2 className="text-xl font-semibold">Active Collaborations</h2>
          <Card>
            <CardContent className="p-8 text-center">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Collaborations</h3>
              <p className="text-muted-foreground">
                Your collaboration invitations and shared reminder activities will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
