'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Smartphone, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';

export default function WhatsAppSetup() {
  const [status, setStatus] = useState({ ready: false, development: true, message: 'Loading...' });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/whatsapp')
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(() => setStatus({ ready: false, development: true, message: 'Error loading' }));
  }, []);

  const handleTest = async () => {
    if (!phoneNumber.trim()) {
      setMessage('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', phoneNumber: phoneNumber.trim() }),
      });

      const result = await response.json();
      setMessage(result.success ? '✅ Test message sent!' : `❌ Failed: ${result.error}`);
    } catch {
      setMessage('❌ Failed to send test message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <MessageCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            WhatsApp Notifications
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Set up instant WhatsApp notifications for your reminders - no QR code scanning required!
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:gap-8">
          {/* Left Column - Setup */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Service Status Card */}
            <Card className="shadow-lg border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Service Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {status.ready ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {status.message}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge 
                      variant={status.ready ? "default" : "secondary"}
                      className={status.ready ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {status.ready ? "Ready" : "Loading"}
                    </Badge>
                    {status.development && (
                      <Badge variant="outline" className="border-orange-300 text-orange-600 bg-orange-50 dark:bg-orange-900/20">
                        Dev Mode
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phone Number Input Card */}
            <Card className="shadow-lg border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  Direct Messaging
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Enter your WhatsApp number to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    WhatsApp Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98192 88130"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="font-mono text-base h-12 border-2 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-center sm:text-left"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 justify-center sm:justify-start">
                    <span className="inline-block w-1 h-1 bg-blue-500 rounded-full"></span>
                    Enter with country code (e.g., +91 98192 88130)
                  </p>
                </div>

                <Button 
                  onClick={handleTest} 
                  disabled={isLoading || !phoneNumber.trim()} 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transform transition-all duration-200 hover:scale-[1.02] shadow-lg disabled:transform-none disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Send Test Message
                    </div>
                  )}
                </Button>

                {message && (
                  <Alert className={`border-l-4 animate-in slide-in-from-top-2 duration-300 ${message.includes('✅') 
                    ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <AlertDescription className={`font-medium ${message.includes('✅') 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'
                    }`}>
                      {message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - How It Works */}
          <div className="order-1 lg:order-2">
            <Card className="shadow-lg border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm h-fit sticky top-8 hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-2xl">🚀</span>
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-4 group cursor-pointer">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:shadow-xl">
                        <span className="text-white text-sm font-bold">1</span>
                      </div>
                    </div>
                    <div className="flex-1 group-hover:translate-x-1 transition-transform duration-200">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Simple Setup</h4>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Just enter your WhatsApp phone number - no QR scanning!
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 group cursor-pointer">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:shadow-xl">
                        <span className="text-white text-sm font-bold">2</span>
                      </div>
                    </div>
                    <div className="flex-1 group-hover:translate-x-1 transition-transform duration-200">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">30-Minute Alerts</h4>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Receive automatic reminders 30 minutes before your due time
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 group cursor-pointer">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:shadow-xl">
                        <span className="text-white text-sm font-bold">3</span>
                      </div>
                    </div>
                    <div className="flex-1 group-hover:translate-x-1 transition-transform duration-200">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Reliable Delivery</h4>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Powered by Twilio WhatsApp API for instant delivery
                      </p>
                    </div>
                  </div>
                </div>

                {status.development && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800/50 animate-in fade-in duration-500">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex-shrink-0">
                        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                          Development Mode
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                          Messages are mocked in dev mode. Check the console for mock message logs.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
