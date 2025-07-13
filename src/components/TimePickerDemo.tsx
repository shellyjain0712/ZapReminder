import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function TimePickerDemo() {
  const [selectedTime, setSelectedTime] = useState('14:30');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCreateReminder = () => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dueDate = new Date(selectedDate);
    const reminderTime = new Date(selectedDate);
    reminderTime.setHours(hours, minutes, 0, 0);

    toast.success(`Reminder set for ${dueDate.toDateString()} at ${reminderTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, {
      description: 'Your reminder has been created with the specific time!'
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">🕒 Time Picker Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Select Time:</label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <div className="text-sm text-muted-foreground text-center">
          Reminder will be set for:<br />
          <strong>
            {new Date(selectedDate).toDateString()} at {' '}
            {new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </strong>
        </div>
        
        <Button onClick={handleCreateReminder} className="w-full">
          Create Timed Reminder
        </Button>
      </CardContent>
    </Card>
  );
}
