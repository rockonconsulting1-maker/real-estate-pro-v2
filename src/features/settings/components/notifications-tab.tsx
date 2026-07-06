import React from 'react';
import { useAuth } from '@/app/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function NotificationsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['sb', 'profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: any) => {
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: newPreferences })
        .eq('id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sb', 'profile', user?.id] });
      toast.success('Preferences updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update preferences: ' + error.message);
    },
  });

  const preferences = profile?.preferences || {
    newLead: true,
    offerUpdates: true,
    taskDue: true,
    appointmentReminders: true,
  };

  const handleToggle = (key: string, checked: boolean) => {
    updatePreferencesMutation.mutate({
      ...preferences,
      [key]: checked,
    });
  };

  if (isLoading) return <div>Loading preferences...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Choose what updates you want to receive via email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Leads</Label>
              <p className="text-sm text-muted-foreground">Receive an email when a new lead enters your pipeline.</p>
            </div>
            <Switch 
              checked={preferences.newLead} 
              onCheckedChange={(c) => handleToggle('newLead', c)} 
              disabled={updatePreferencesMutation.isPending}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Offer Updates</Label>
              <p className="text-sm text-muted-foreground">Get notified when an offer is accepted, countered, or declined.</p>
            </div>
            <Switch 
              checked={preferences.offerUpdates} 
              onCheckedChange={(c) => handleToggle('offerUpdates', c)} 
              disabled={updatePreferencesMutation.isPending}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Task Due Reminders</Label>
              <p className="text-sm text-muted-foreground">Daily digest of tasks due today or overdue.</p>
            </div>
            <Switch 
              checked={preferences.taskDue} 
              onCheckedChange={(c) => handleToggle('taskDue', c)} 
              disabled={updatePreferencesMutation.isPending}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Appointment Reminders</Label>
              <p className="text-sm text-muted-foreground">Get notified 1 hour before an upcoming appointment.</p>
            </div>
            <Switch 
              checked={preferences.appointmentReminders} 
              onCheckedChange={(c) => handleToggle('appointmentReminders', c)} 
              disabled={updatePreferencesMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
