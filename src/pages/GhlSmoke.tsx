import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGhlCredentials } from '@/hooks/use-ghl-credentials';
import { validateCredentials } from '@/lib/ghl/client';
import { contactsService, opportunitiesService } from '@/lib/ghl/services';

export default function GhlSmoke() {
  const { pit, locationId, isConfigured } = useGhlCredentials();
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    if (!pit || !locationId) {
      setError('Credentials not configured');
      return;
    }

    setLoading(true);
    setError(null);
    setResults({});

    try {
      // 1. Validate Credentials
      const validation = await validateCredentials(pit, locationId);
      setResults((prev) => ({ ...prev, validation }));

      if (!validation.ok) {
        throw new Error('Credential validation failed');
      }

      // 2. Fetch Contacts
      try {
        const contacts = await contactsService.search({ query: '', page: 1 });
        setResults((prev) => ({ ...prev, contacts: { count: contacts.contacts.length } }));
      } catch (e) {
        setResults((prev) => ({ ...prev, contacts: { error: e instanceof Error ? e.message : 'Error' } }));
      }

      // 3. Fetch Opportunities
      try {
        const opps = await opportunitiesService.search();
        setResults((prev) => ({ ...prev, opportunities: { count: opps.opportunities.length } }));
      } catch (e) {
        setResults((prev) => ({ ...prev, opportunities: { error: e instanceof Error ? e.message : 'Error' } }));
      }

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GHL API Smoke Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm"><strong>Configured:</strong> {isConfigured ? 'Yes' : 'No'}</p>
            {isConfigured && (
              <p className="text-sm text-muted-foreground break-all">
                <strong>Location ID:</strong> {locationId}
              </p>
            )}
          </div>

          <Button onClick={runTests} disabled={!isConfigured || loading}>
            {loading ? 'Running Tests...' : 'Run Smoke Tests'}
          </Button>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          {Object.keys(results).length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold">Results</h3>
              <pre className="p-4 bg-surface border rounded-md text-sm overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
