'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { MessageSquare, Send, Loader2 } from 'lucide-react';

export default function TestWhatsAppPage() {
  const { status } = useSession();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('🧪 This is a test notification from your Reminder App!\n\nWhatsApp integration is working perfectly! 🎉');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendTest = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/test-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          message: message.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Test WhatsApp notification sent successfully! 🎉');
        console.log('✅ WhatsApp test result:', result);
      } else {
        toast.error(`Failed to send: ${result.message || result.error}`);
        console.error('❌ WhatsApp test failed:', result);
      }
    } catch (error) {
      toast.error('Error sending test notification');
      console.error('❌ WhatsApp test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Please log in to test WhatsApp notifications.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-green-600" />
            Test WhatsApp Notifications
          </CardTitle>
          <p className="text-muted-foreground">
            Send a test message to verify your WhatsApp integration is working.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number (e.g., +1234567890)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Include country code (e.g., +91 for India, +1 for US)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Test Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your test message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">📱 WhatsApp Status</h4>
            <p className="text-sm text-blue-800">
              Your WhatsApp Web.js client should be connected and ready to send messages.
              Make sure you've scanned the QR code in your terminal.
            </p>
          </div>

          <Button 
            onClick={handleSendTest} 
            disabled={isLoading || !phoneNumber.trim() || !message.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Test...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Notification
              </>
            )}
          </Button>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Important Notes</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Make sure the WhatsApp service is running in your terminal</li>
              <li>• You must have scanned the QR code to authenticate</li>
              <li>• The phone number should be in international format</li>
              <li>• You can only send messages to numbers that have WhatsApp</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
