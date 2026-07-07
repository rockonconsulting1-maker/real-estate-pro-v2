import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sb, ghl } from '@/lib/queryKeys';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { contactsService } from '@/lib/ghl/services/contacts';
import { objectsService, OBJECT_KEYS } from '@/lib/ghl/services/objects';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/app/auth-provider';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { PipelineRegistry } from '@/lib/pipeline-registry';

const COLORS = ['#4f46e5', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981'];

export function MobileReportsView() {
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

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', 'all-data'],
    queryFn: async () => {
      const [opps, contacts, listings] = await Promise.all([
        import('@/hooks/use-query-helpers').then(m => m.fetchAllPages(
          async (cursor?: string) => {
            const res = await opportunitiesService.search({ limit: 100, page: cursor ? parseInt(cursor) : 1 });
            return { items: res.opportunities || [], nextCursor: res.opportunities?.length === 100 ? String((cursor ? parseInt(cursor) : 1) + 1) : undefined };
          }
        )),
        import('@/hooks/use-query-helpers').then(m => m.fetchAllPages(
          async (cursor?: string) => {
            const res = await contactsService.search({ limit: 100, page: cursor ? parseInt(cursor) : 1 });
            return { items: res.contacts || [], nextCursor: res.contacts?.length === 100 ? String((cursor ? parseInt(cursor) : 1) + 1) : undefined };
          }
        )),
        import('@/hooks/use-query-helpers').then(m => m.fetchAllPages(
          async (cursor?: string) => {
            const res = await objectsService.searchRecords(OBJECT_KEYS.listings, { pageLimit: 100, searchAfter: cursor ? [cursor] : undefined });
            return { items: res.records || [], nextCursor: res.meta?.nextPageToken as string | undefined };
          }
        ))
      ]);
      return {
        opportunities: opps.items,
        contacts: contacts.items,
        listings: listings.items,
        hitCap: opps.hitCap || contacts.hitCap || listings.hitCap
      };
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const oppsData = reportData;
  const contactsData = reportData;
  const listingsData = reportData;

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
      const dateStr = opp.status === 'won' ? (opp.updatedAt || opp.createdAt) : opp.createdAt;
      if (!dateStr) return false;
      return isWithinInterval(parseISO(dateStr), dateInterval);
    });
  }, [oppsData, dateInterval]);

  const totalGCI = filteredOpps
    .filter(o => o.status === 'won')
    .reduce((sum, o) => sum + (o.monetaryValue || 0), 0);
  const goal = profile?.gci_goal || 1000000;
  const gciProgress = Math.min((totalGCI / goal) * 100, 100);

  const volumeByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    filteredOpps.filter(o => o.status === 'won').forEach(o => {
      const dateStr = o.updatedAt || o.createdAt!;
      const month = format(parseISO(dateStr), 'MMM');
      months[month] = (months[month] || 0) + (o.monetaryValue || 0);
    });
    return Object.entries(months).map(([name, volume]) => ({ name, volume }));
  }, [filteredOpps]);

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
          const ucPos = registry.underContractPosition(o.pipelineId);
          if (ucPos !== -1 && pos >= ucPos) underContract++;
        }
      }
    });
    return [
      { name: 'Leads', value: lead },
      { name: 'Clients', value: client },
      { name: 'U/C', value: underContract },
      { name: 'Closed', value: closed },
    ];
  }, [filteredOpps, registry]);

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

  const avgDOM = useMemo(() => {
    if (!listingsData?.listings) return 0;
    let sum = 0, count = 0;
    listingsData.listings.forEach((r: any) => {
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
    <>
      <div className="p-4 space-y-4 pb-24">
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={exportCSV}>
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {(reportData as any)?.hitCap && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
            <AlertTriangle className="h-3 w-3" />
            Note: Analytics are based on the first 1,000 records.
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* GCI Goal Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-card-header">GCI vs Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-2">
                  <span className="text-xl font-bold tabular-nums">${totalGCI.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">Target: ${goal.toLocaleString()}</span>
                </div>
                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand transition-all" 
                    style={{ width: `${gciProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-right">{gciProgress.toFixed(1)}% achieved</p>
              </CardContent>
            </Card>

            {/* Avg DOM */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-card-header">Average DOM</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-16">
                <span className="text-3xl font-bold tabular-nums">{avgDOM}</span>
                <span className="text-muted-foreground ml-2 text-sm">days</span>
              </CardContent>
            </Card>

            {/* Deal Volume by Month */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-card-header">Deal Volume</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px] px-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeByMonth} margin={{ left: 0, right: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      tickFormatter={(val) => `$${val/1000}k`} 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      width={50}
                    />
                    <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                    <Bar dataKey="volume" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pipeline Funnel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-card-header">Conversion</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px] px-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 60, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--role-buyer)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Source Attribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-card-header">Source</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
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
    </>
  );
}
