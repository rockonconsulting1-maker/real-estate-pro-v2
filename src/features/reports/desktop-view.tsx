import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sb, ghl } from '@/lib/queryKeys';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { contactsService } from '@/lib/ghl/services/contacts';
import { objectsService } from '@/lib/ghl/services/objects';
import { DesktopShell } from '@/components/desktop/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/app/auth-provider';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { PipelineRegistry } from '@/lib/pipeline-registry';

const COLORS = ['#4f46e5', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981'];

export function DesktopReportsView() {
  const { user } = useAuth();
  const registry = PipelineRegistry;
  const [dateRange, setDateRange] = useState('this_year');

  const { data: profile } = useQuery({
    queryKey: sb.profile(),
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: oppsData, isLoading: oppsLoading } = useQuery({
    queryKey: ghl.opps({ limit: 100 }),
    queryFn: () => opportunitiesService.search({ limit: 100 }),
  });

  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ghl.contacts({ limit: 100 }),
    queryFn: () => contactsService.search({ limit: 100 }),
  });

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ghl.records('custom_objects.my_listings', { pageLimit: 100 }),
    queryFn: () => objectsService.searchRecords('custom_objects.my_listings', { pageLimit: 100 }),
  });

  const isLoading = oppsLoading || contactsLoading || listingsLoading;

  const dateInterval = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'this_month': return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'this_quarter': return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case 'this_year': return { start: startOfYear(now), end: endOfYear(now) };
      default: return { start: startOfYear(now), end: endOfYear(now) };
    }
  }, [dateRange]);

  const filteredOpps = useMemo(() => {
    if (!oppsData?.opportunities) return [];
    return oppsData.opportunities.filter(opp => {
      if (!opp.createdAt) return false;
      return isWithinInterval(parseISO(opp.createdAt), dateInterval);
    });
  }, [oppsData, dateInterval]);

  // GCI Calculation
  const totalGCI = filteredOpps
    .filter(o => o.status === 'won')
    .reduce((sum, o) => sum + (o.monetaryValue || 0), 0);
  const goal = profile?.gci_goal || 1000000;
  const gciProgress = Math.min((totalGCI / goal) * 100, 100);

  // Deal Volume by Month
  const volumeByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    filteredOpps.filter(o => o.status === 'won').forEach(o => {
      const month = format(parseISO(o.createdAt!), 'MMM');
      months[month] = (months[month] || 0) + (o.monetaryValue || 0);
    });
    return Object.entries(months).map(([name, volume]) => ({ name, volume }));
  }, [filteredOpps]);

  // Pipeline Funnel
  const funnelData = useMemo(() => {
    let lead = 0, client = 0, underContract = 0, closed = 0;
    filteredOpps.forEach(o => {
      if (!o.pipelineId) return;
      const pipe = registry.getPipeline(o.pipelineId);
      if (!pipe) return;
      if (pipe.name.toLowerCase().includes('lead')) lead++;
      else if (pipe.name.toLowerCase().includes('buyer') || pipe.name.toLowerCase().includes('seller')) {
        client++;
        if (o.status === 'won') closed++;
        else {
          const pos = registry.stagePosition(o.pipelineStageId);
          if (pos >= 3) underContract++; // Approximating "Under Contract"
        }
      }
    });
    return [
      { name: 'Leads', value: lead },
      { name: 'Clients', value: client },
      { name: 'Under Contract', value: underContract },
      { name: 'Closed', value: closed },
    ];
  }, [filteredOpps, registry]);

  // Source Attribution
  const sourceData = useMemo(() => {
    if (!contactsData?.contacts) return [];
    const sources: Record<string, number> = {};
    contactsData.contacts.forEach(c => {
      if (!c.dateAdded || !isWithinInterval(parseISO(c.dateAdded), dateInterval)) return;
      const source = c.source || 'Unknown';
      sources[source] = (sources[source] || 0) + 1;
    });
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [contactsData, dateInterval]);

  // Avg DOM
  const avgDOM = useMemo(() => {
    if (!listingsData?.records) return 0;
    let sum = 0, count = 0;
    listingsData.records.forEach((r: any) => {
      if (r.dom) { sum += Number(r.dom); count++; }
    });
    return count ? Math.round(sum / count) : 0;
  }, [listingsData]);

  const exportCSV = () => {
    const rows = filteredOpps.map(o => ({
      Name: o.name,
      Status: o.status,
      Value: o.monetaryValue,
      Date: o.createdAt
    }));
    const csv = ['Name,Status,Value,Date', ...rows.map(r => `"${r.Name}","${r.Status}",${r.Value},${r.Date}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${dateRange}.csv`;
    a.click();
  };

  return (
    <DesktopShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title-desktop">Reports</h1>
            <p className="text-muted-foreground text-sm">Analytics and performance tracking.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="this_quarter">This Quarter</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* GCI Goal Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-card-header">GCI vs Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-2">
                  <span className="text-2xl font-bold tabular-nums">${totalGCI.toLocaleString()}</span>
                  <span className="text-muted-foreground">Target: ${goal.toLocaleString()}</span>
                </div>
                <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand transition-all" 
                    style={{ width: `${gciProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2 text-right">{gciProgress.toFixed(1)}% achieved</p>
              </CardContent>
            </Card>

            {/* Avg DOM */}
            <Card>
              <CardHeader>
                <CardTitle className="text-card-header">Average Days on Market</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-24">
                <span className="text-4xl font-bold tabular-nums">{avgDOM}</span>
                <span className="text-muted-foreground ml-2">days</span>
              </CardContent>
            </Card>

            {/* Deal Volume by Month */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-card-header">Deal Volume by Month</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeByMonth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `$${val/1000}k`} />
                    <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                    <Bar dataKey="volume" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pipeline Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-card-header">Pipeline Conversion</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--role-buyer)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Source Attribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-card-header">Source Attribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DesktopShell>
  );
}
