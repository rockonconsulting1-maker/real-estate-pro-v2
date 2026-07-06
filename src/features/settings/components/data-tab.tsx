import React, { useState } from 'react';
import { useAuth } from '@/app/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Download, Trash2, LogOut, AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { contactsService } from '@/lib/ghl/services/contacts';

export function DataTab() {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleClearCache = () => {
    queryClient.clear();
    localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
    toast.success('Local cache cleared');
    window.location.reload();
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      toast.info('Gathering data for export...');
      
      // Fetch some basic data to export
      const opps = await opportunitiesService.search({ limit: 100 });
      const contacts = await contactsService.search({ limit: 100 });
      
      const data = {
        exportDate: new Date().toISOString(),
        opportunities: opps.opportunities,
        contacts: contacts.contacts,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rc-crm-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error: any) {
      toast.error('Failed to export data: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      // Delete user from Supabase. Note: this requires an edge function or admin API in a real app.
      // For now, we'll just sign them out and show a message.
      toast.error('Account deletion requires admin privileges. Please contact support.');
    } catch (error: any) {
      toast.error('Failed to delete account: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export your data or clear your local cache.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Export Data</h4>
              <p className="text-sm text-muted-foreground">Download a JSON backup of your contacts and opportunities.</p>
            </div>
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Clear Local Cache</h4>
              <p className="text-sm text-muted-foreground">Fix issues by clearing cached data. You will need to reload the app.</p>
            </div>
            <Button variant="outline" onClick={handleClearCache}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-danger/50">
        <CardHeader>
          <CardTitle className="text-danger">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions related to your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-danger/20 rounded-lg bg-danger/5">
            <div>
              <h4 className="font-medium text-danger">Sign Out</h4>
              <p className="text-sm text-muted-foreground">Sign out of your account on this device.</p>
            </div>
            <Button variant="outline" className="text-danger border-danger/50 hover:bg-danger/10" onClick={() => signOut()}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-danger/20 rounded-lg bg-danger/5">
            <div>
              <h4 className="font-medium text-danger">Delete Account</h4>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 text-xs text-muted-foreground justify-center">
          Real Estate Pro CRM v1.0.0
        </CardFooter>
      </Card>
    </div>
  );
}
