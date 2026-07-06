import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/app/auth-provider';
import { useGhlCredentials } from '@/hooks/use-ghl-credentials';
import { supabase } from '@/lib/supabase/client';
import { validateCredentials } from '@/lib/ghl/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Eye, EyeOff, Loader2, Shield, AlertCircle, ExternalLink, Trash2, Key } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

const scopes = [
  'contacts.readonly', 'contacts.write',
  'opportunities.readonly', 'opportunities.write',
  'custom_objects.readonly', 'custom_objects.write',
  'associations.readonly', 'associations.write',
  'conversations.readonly', 'conversations.write', 'conversations/message.readonly', 'conversations/message.write',
  'calendars.readonly', 'calendars.write', 'calendars/events.readonly', 'calendars/events.write',
  'users.readonly',
  'locations.readonly',
  'custom_fields.readonly', 'custom_values.readonly',
  'tags.readonly', 'tags.write',
  'medias.readonly', 'medias.write',
  'tasks.readonly', 'tasks.write',
  'notes.readonly', 'notes.write'
];

const formSchema = z.object({
  locationId: z.string().min(1, 'Location ID is required'),
  pit: z.string().min(1, 'Private Integration Token is required'),
});

export default function Integrations() {
  const { session } = useAuth();
  const { pit, locationId, isConfigured, refresh } = useGhlCredentials();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const [showToken, setShowToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; locationName?: string; error?: string } | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locationId: locationId || '',
      pit: pit || '',
    },
  });

  const onTest = async () => {
    const values = form.getValues();
    if (!values.locationId || !values.pit) {
      form.trigger(['locationId', 'pit']);
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await validateCredentials(values.pit, values.locationId);
      if (result.ok) {
        setTestResult({ ok: true, locationName: result.locationName });
        toast.success(`Connected to ${result.locationName}`);
      } else {
        setTestResult({ ok: false, error: 'Invalid token, wrong location, or missing scopes.' });
      }
    } catch (e) {
      setTestResult({ ok: false, error: 'Connection failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ghl_credentials')
        .upsert({
          user_id: session.user.id,
          pit_token: values.pit,
          location_id: values.locationId,
          updated_at: new Date().toISOString(),
        });
        
      if (error) throw error;
      
      await refresh();
      toast.success('Credentials saved successfully');
      
      // If we came from a redirect due to missing creds, go back to dashboard
      if (location.pathname === '/settings/integrations' && !isConfigured) {
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save credentials');
    } finally {
      setIsSaving(false);
    }
  };

  const onDisconnect = async () => {
    if (!session?.user?.id) return;
    if (!confirm('Are you sure you want to disconnect? This will break the CRM functionality until reconnected.')) return;
    
    try {
      const { error } = await supabase
        .from('ghl_credentials')
        .delete()
        .eq('user_id', session.user.id);
        
      if (error) throw error;
      
      // Clear react query cache for anything GHL related
      queryClient.removeQueries({ queryKey: ['ghl'] });
      
      form.reset({ locationId: '', pit: '' });
      setTestResult(null);
      await refresh();
      toast.success('Disconnected successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect');
    }
  };

  if (isConfigured && pit) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">Manage your CRM API connection.</p>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <div>
                  <CardTitle>Connected to GHL</CardTitle>
                  <CardDescription>Your API connection is active</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onDisconnect} className="text-danger border-danger/20 hover:bg-danger/10 hover:text-danger">
                <Trash2 className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Location ID</Label>
                <div className="font-medium">{locationId}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Private Integration Token</Label>
                <div className="font-medium font-mono">
                  ••••••••{pit.slice(-4)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {!isConfigured && (
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Connect your CRM</h1>
          <p className="text-muted-foreground text-lg">
            To use Real Estate Pro, you need to connect it to your GoHighLevel location using a Private Integration Token (PIT).
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Credentials</CardTitle>
              <CardDescription>Enter your Location ID and PIT token.</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="creds-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="locationId">Location ID</Label>
                  <Input 
                    id="locationId" 
                    placeholder="Enter your Location ID" 
                    {...form.register('locationId')}
                  />
                  {form.formState.errors.locationId && (
                    <p className="text-sm text-danger">{form.formState.errors.locationId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pit">Private Integration Token (PIT)</Label>
                  <div className="relative">
                    <Input 
                      id="pit" 
                      type={showToken ? 'text' : 'password'}
                      placeholder="Enter your PIT" 
                      {...form.register('pit')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {form.formState.errors.pit && (
                    <p className="text-sm text-danger">{form.formState.errors.pit.message}</p>
                  )}
                </div>
              </form>

              {testResult && (
                <Alert className={`mt-4 ${testResult.ok ? 'border-success/50 bg-success/5 text-success' : 'border-danger/50 bg-danger/5 text-danger'}`}>
                  {testResult.ok ? <Check className="h-4 w-4 !text-success" /> : <AlertCircle className="h-4 w-4 !text-danger" />}
                  <AlertTitle>{testResult.ok ? 'Connection Successful' : 'Connection Failed'}</AlertTitle>
                  <AlertDescription>
                    {testResult.ok ? `Successfully connected to ${testResult.locationName}.` : testResult.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 p-6">
              <Button type="button" variant="outline" onClick={onTest} disabled={isTesting}>
                {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                Test Connection
              </Button>
              <Button type="submit" form="creds-form" disabled={isSaving || !testResult?.ok}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Connection
              </Button>
            </CardFooter>
          </Card>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Security Note</AlertTitle>
            <AlertDescription className="text-xs mt-2">
              Your token is stored securely in your Supabase account with Row Level Security. It is only transmitted from your active browser session directly to the GHL API.
            </AlertDescription>
          </Alert>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
            <h3 className="font-semibold">How to create a PIT</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Go to your GHL location Settings</li>
              <li>Click on Private Integrations</li>
              <li>Click "New" and select your location</li>
              <li>Add all required scopes below</li>
              <li>Copy the generated token</li>
            </ol>
            <Button variant="link" className="p-0 h-auto text-brand" asChild>
              <a href="https://marketplace.gohighlevel.com/docs/Authorization/PrivateIntegrationsToken" target="_blank" rel="noopener noreferrer">
                View Official Documentation <ExternalLink className="ml-1 w-3 h-3" />
              </a>
            </Button>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4">
            <h3 className="font-semibold">Required Scopes</h3>
            <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-2">
              {scopes.map(scope => (
                <div key={scope} className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <Check className="w-3 h-3 text-success shrink-0" />
                  {scope}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
