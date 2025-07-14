'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { addReminderToCalendar } from '@/lib/calendar-integration';
import { toast } from 'sonner';

export default function CalendarTestPage() {
  const [title, setTitle] = useState('Test Calendar Event');
  const [description, setDescription] = useState('Testing direct calendar integration');
  const [isLoading, setIsLoading] = useState(false);

  const testCalendarIntegration = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsLoading(true);
    try {
      const dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + 2); // 2 hours from now
      
      const result = await addReminderToCalendar(
        title,
        description,
        dueDate,
        dueDate
      );
      
      console.log('Calendar integration result:', result);
      
    } catch (error) {
      console.error('Error testing calendar integration:', error);
      toast.error('Calendar integration test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      toast.info(`Notification permission: ${permission}`);
    } else {
      toast.warning('Notifications not supported in this browser');
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>📅 Calendar Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter event description"
            />
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={testCalendarIntegration}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : '📅 Test Calendar Integration'}
            </Button>
            
            <Button 
              onClick={testNotificationPermission}
              variant="outline"
              className="w-full"
            >
              🔔 Test Notification Permission
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>This test will:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Open Google Calendar in a new tab with pre-filled event</li>
              <li>Show calendar integration notifications</li>
              <li>Provide option to try Outlook Calendar</li>
              <li>Test notification permissions</li>
            </ul>
            
            <p><strong>Expected behavior:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>📅 Google Calendar tab opens automatically</li>
              <li>Toast notification with event details</li>
              <li>Option to switch to Outlook Calendar</li>
              <li>Browser may ask for notification permission</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
