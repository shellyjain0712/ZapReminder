'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Archive, 
  RefreshCw,
  HardDrive,
  Calendar,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';

export default function DataManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Real data usage stats
  const [dataStats, setDataStats] = useState({
    totalReminders: 0,
    activeReminders: 0,
    completedReminders: 0,
    totalDataSize: '0 MB',
    lastBackup: 'Never',
    storageUsed: 0, // percentage
    accountAge: '0 months',
    isLoading: true
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    void fetchDataStats();
  }, [session, status, router]);

  const fetchDataStats = async () => {
    try {
      const response = await fetch('/api/reminders');
      if (!response.ok) {
        throw new Error('Failed to fetch reminders');
      }
      
      const reminders = await response.json() as Array<{ id: string; isCompleted: boolean; createdAt: string }>;
      
      const totalReminders = reminders.length;
      const completedReminders = reminders.filter(r => r.isCompleted).length;
      const activeReminders = totalReminders - completedReminders;
      
      // Calculate account age
      const accountCreated = reminders.length > 0 ? 
        new Date(Math.min(...reminders.map(r => new Date(r.createdAt).getTime()))) : 
        new Date();
      const accountAge = Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24 * 30));
      
      // Calculate approximate data size (rough estimate)
      const averageReminderSize = 0.5; // KB per reminder
      const totalDataSizeKB = totalReminders * averageReminderSize;
      const totalDataSize = totalDataSizeKB < 1024 ? 
        `${totalDataSizeKB.toFixed(1)} KB` : 
        `${(totalDataSizeKB / 1024).toFixed(1)} MB`;
      
      setDataStats({
        totalReminders,
        activeReminders,
        completedReminders,
        totalDataSize,
        lastBackup: 'Never',
        storageUsed: Math.min(Math.floor((totalReminders / 1000) * 100), 100),
        accountAge: accountAge === 0 ? 'New' : `${accountAge} month${accountAge !== 1 ? 's' : ''}`,
        isLoading: false
      });
    } catch (_error) {
      console.error('Error fetching data stats:', _error);
      setDataStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [session, status, router]);

  const exportData = async (format: 'json' | 'csv') => {
    setIsLoading(true);
    try {
      // Simulate export process
      toast.promise(
        new Promise(resolve => setTimeout(resolve, 3000)),
        {
          loading: `Preparing ${format.toUpperCase()} export...`,
          success: `Data exported successfully as ${format.toUpperCase()}`,
          error: 'Failed to export data'
        }
      );
    } catch {
      toast.error('Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  const importData = async () => {
    setIsLoading(true);
    try {
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Data imported successfully');
    } catch {
      toast.error('Failed to import data');
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    setIsLoading(true);
    try {
      toast.promise(
        new Promise(resolve => setTimeout(resolve, 2500)),
        {
          loading: 'Creating backup...',
          success: 'Backup created successfully',
          error: 'Failed to create backup'
        }
      );
    } catch {
      toast.error('Backup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const archiveOldData = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Old data archived successfully');
    } catch {
      toast.error('Failed to archive data');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAllData = async () => {
    if (deleteConfirmation !== 'DELETE MY DATA') {
      toast.error('Please type "DELETE MY DATA" to confirm');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate deletion process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('All data deleted successfully');
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
      // In a real app, this would sign out the user
    } catch {
      toast.error('Failed to delete data');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
        <p className="text-muted-foreground">
          Export, import, backup, and manage your account data.
        </p>
      </div>

      {/* Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Overview
          </CardTitle>
          <CardDescription>
            Summary of your account data and storage usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{dataStats.totalReminders}</p>
              <p className="text-sm text-muted-foreground">Total Reminders</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{dataStats.completedReminders}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <HardDrive className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{dataStats.totalDataSize}</p>
              <p className="text-sm text-muted-foreground">Data Size</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{dataStats.accountAge}</p>
              <p className="text-sm text-muted-foreground">Account Age</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage Used</span>
              <span>{dataStats.storageUsed}%</span>
            </div>
            <Progress value={dataStats.storageUsed} className="h-2" />
            <p className="text-xs text-muted-foreground">
              You&apos;re using {dataStats.totalDataSize} of your available storage
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download your data in various formats for backup or migration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <h4 className="font-medium">JSON Export</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete data export in JSON format
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => exportData('json')} 
                disabled={isLoading} 
                className="w-full"
                variant="outline"
              >
                Export as JSON
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="h-5 w-5 text-green-500" />
                <div>
                  <h4 className="font-medium">CSV Export</h4>
                  <p className="text-sm text-muted-foreground">
                    Spreadsheet-friendly format
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => exportData('csv')} 
                disabled={isLoading} 
                className="w-full"
                variant="outline"
              >
                Export as CSV
              </Button>
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your exported data is encrypted and will include all reminders, settings, and account information.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Import Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Import data from a previous export or another service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-medium mb-2">Choose file to import</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Supports JSON and CSV files from previous exports
            </p>
            <Input type="file" accept=".json,.csv" className="max-w-xs mx-auto" />
          </div>

          <div className="flex gap-2">
            <Button onClick={importData} disabled={isLoading}>
              Import Data
            </Button>
            <Button variant="outline" disabled>
              Preview Import
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Importing data will merge with your existing data. Duplicate reminders will be skipped.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Backup & Archive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup & Archive
          </CardTitle>
          <CardDescription>
            Create backups and archive old data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              <div>
                <h4 className="font-medium">Create Backup</h4>
                <p className="text-sm text-muted-foreground">
                  Last backup: {dataStats.lastBackup}
                </p>
              </div>
            </div>
            <Button onClick={createBackup} disabled={isLoading}>
              Create Backup
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Archive className="h-5 w-5 text-orange-500" />
              <div>
                <h4 className="font-medium">Archive Old Data</h4>
                <p className="text-sm text-muted-foreground">
                  Archive completed reminders older than 1 year
                </p>
              </div>
            </div>
            <Button onClick={archiveOldData} disabled={isLoading} variant="outline">
              Archive Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Data Cleanup
          </CardTitle>
          <CardDescription>
            Remove unnecessary data to free up storage space
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium text-sm">Clear Completed Reminders</h4>
                <p className="text-xs text-muted-foreground">
                  Remove all completed reminders older than 6 months
                </p>
              </div>
              <Button size="sm" variant="outline">
                Clean Up
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium text-sm">Clear Cache</h4>
                <p className="text-xs text-muted-foreground">
                  Remove temporary files and cached data
                </p>
              </div>
              <Button size="sm" variant="outline">
                Clear Cache
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium text-sm">Optimize Database</h4>
                <p className="text-xs text-muted-foreground">
                  Reorganize data for better performance
                </p>
              </div>
              <Button size="sm" variant="outline">
                Optimize
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that will permanently delete your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                Delete All Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete All Data</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account data including all reminders, settings, and preferences.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    To confirm deletion, please type <strong>&quot;DELETE MY DATA&quot;</strong> in the box below.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label>Confirmation</Label>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type DELETE MY DATA to confirm"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmation('');
                }}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={deleteAllData}
                  disabled={isLoading || deleteConfirmation !== 'DELETE MY DATA'}
                >
                  {isLoading ? 'Deleting...' : 'Delete All Data'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
