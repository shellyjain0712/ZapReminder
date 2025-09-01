'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TestResult = {
  success: boolean;
  message: string;
  timestamp?: string;
  error?: string;
};

export default function TestRemindersPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const triggerReminderProcessing = async () => {
    setIsProcessing(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test-reminders', {
        method: 'GET',
      });
      
      const data = await response.json() as TestResult;
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to trigger reminder processing',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🧪 Test Reminder Processing</CardTitle>
          <CardDescription>
            Manually trigger the reminder processing system to test advance notifications and reminder emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={triggerReminderProcessing}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? '⏳ Processing Reminders...' : '🔄 Process Reminders Now'}
          </Button>
          
          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? '✅ Success' : '❌ Error'}
              </h3>
              <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                {result.message}
              </p>
              {result.timestamp && (
                <p className="text-sm text-gray-500 mt-2">
                  Processed at: {new Date(result.timestamp).toLocaleString()}
                </p>
              )}
              {result.error && (
                <p className="text-sm text-red-600 mt-2">
                  Error: {result.error}
                </p>
              )}
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">📋 How it works:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Checks all active reminders with notification times or reminder times</li>
              <li>• Sends advance notice emails at user-set notification times (e.g., 6pm)</li>
              <li>• Sends reminder-due emails at exact reminder times (e.g., 8pm)</li>
              <li>• Processes recurring reminders based on their patterns</li>
              <li>• Check the server console for detailed logs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
