import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { opportunitiesService } from '@/lib/ghl/services';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Money, StageDot, Countdown } from '@/components/shared/primitives';
import { format, isPast, differenceInDays } from 'date-fns';
import { CheckCircle2, Circle, Clock, Users, DollarSign } from 'lucide-react';

import { Opportunity } from '@/types/ghl';

export default function DesktopTransactionDetail({ id }: { id: string }) {
  const { data: opp, isLoading } = useQuery<Opportunity>({
    queryKey: ghl.opp(id),
    queryFn: () => opportunitiesService.get(id) as Promise<Opportunity>
  });
  
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [commRate, setCommRate] = useState<number | ''>(2.5);
  const [split, setSplit] = useState<number | ''>(70);

  if (isLoading) return <div className="p-6"><Skeleton className="h-full w-full" /></div>;
  if (!opp) return <div className="p-6">Transaction not found</div>;

  const isFirm = (opp as any).tags?.includes('firm') || (opp as any).tags?.includes('Firm');
  const closeDateStr = (opp as any).customFields?.find((f: any) => f.id === 'closing_date')?.value;
  const conditionsDateStr = (opp as any).customFields?.find((f: any) => f.id === 'conditions_deadline')?.value;
  
  const closeDate = closeDateStr ? new Date(closeDateStr) : null;
  const conditionsDate = conditionsDateStr ? new Date(conditionsDateStr) : null;

  const milestones = [
    { label: 'Under Contract', completed: true },
    { label: 'Conditions', completed: isFirm },
    { label: 'Firm', completed: isFirm },
    { label: 'Clear to Close', completed: isFirm && closeDate && differenceInDays(closeDate, new Date()) <= 7 },
    { label: 'Closed', completed: opp.status === 'won' }
  ];

  const price = typeof salePrice === 'number' ? salePrice : (opp.monetaryValue || 0);
  const rate = typeof commRate === 'number' ? commRate : 0;
  const splitPct = typeof split === 'number' ? split : 0;
  
  const gross = price * (rate / 100);
  const net = gross * (splitPct / 100);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-6 border-b space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{opp.name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <StageDot stageId={opp.pipelineStageId} />
              <span>{PipelineRegistry.stageLabel(opp.pipelineStageId)}</span>
              <span>•</span>
              <Money amount={opp.monetaryValue || 0} />
              <Badge variant={isFirm ? 'default' : 'secondary'}>{isFirm ? 'Firm' : 'Conditional'}</Badge>
            </div>
          </div>
          <Button variant="outline">Edit Transaction</Button>
        </div>

        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary -z-10" />
          {milestones.map((m, i) => (
            <div key={m.label} className="flex flex-col items-center gap-2 bg-background px-2">
              {m.completed ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-xs font-medium">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-4 space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5"/> Critical Dates</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Conditions Deadline</div>
                      {conditionsDate ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-medium">{format(conditionsDate, 'MMM d, yyyy h:mm a')}</span>
                          {!isPast(conditionsDate) && <Countdown targetDate={conditionsDate} className="text-xs" />}
                        </div>
                      ) : <span className="text-sm">-</span>}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Closing Date</div>
                      {closeDate ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-medium">{format(closeDate, 'MMM d, yyyy')}</span>
                          {!isPast(closeDate) && <Countdown targetDate={closeDate} className="text-xs" />}
                        </div>
                      ) : <span className="text-sm">-</span>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5"/> Commission Calculator</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="space-y-2">
                        <Label>Sale Price</Label>
                        <Input 
                          type="number" 
                          value={salePrice === '' ? opp.monetaryValue || '' : salePrice} 
                          onChange={e => setSalePrice(e.target.value ? Number(e.target.value) : '')} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rate (%)</Label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          value={commRate} 
                          onChange={e => setCommRate(e.target.value ? Number(e.target.value) : '')} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Split (%)</Label>
                        <Input 
                          type="number" 
                          value={split} 
                          onChange={e => setSplit(e.target.value ? Number(e.target.value) : '')} 
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div>
                        <div className="text-sm text-muted-foreground">Gross Commission</div>
                        <div className="text-xl font-medium"><Money amount={gross} /></div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Net to Agent</div>
                        <div className="text-2xl font-bold text-success"><Money amount={net} /></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="conditions" className="mt-4">
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground py-12">
                    Conditions checklist will be loaded from associated offer.
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground py-12">
                    Document vault integration pending.
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="tasks" className="mt-4">
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground py-12">
                    Tasks integration pending.
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground py-12">
                    Notes integration pending.
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="activity" className="mt-4">
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground py-12">
                    Activity feed integration pending.
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5"/> Parties</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center border-b border-border-2 pb-2">
                  <span className="text-sm font-medium">Client</span>
                  <span className="text-sm text-muted-foreground">{(opp as any).contact?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border-2 pb-2">
                  <span className="text-sm font-medium">Co-op Agent</span>
                  <Button variant="link" size="sm" className="h-auto p-0">Add Agent</Button>
                </div>
                <div className="flex justify-between items-center border-b border-border-2 pb-2">
                  <span className="text-sm font-medium">Lawyer</span>
                  <Button variant="link" size="sm" className="h-auto p-0">Add Lawyer</Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Lender</span>
                  <Button variant="link" size="sm" className="h-auto p-0">Add Lender</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
