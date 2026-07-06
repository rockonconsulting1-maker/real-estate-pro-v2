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
import { CheckCircle2, Circle, Clock, Users, DollarSign, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Opportunity } from '@/types/ghl';

export default function MobileTransactionDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const { data: opp, isLoading } = useQuery<Opportunity>({
    queryKey: ghl.opp(id),
    queryFn: () => opportunitiesService.get(id) as Promise<Opportunity>
  });
  
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [commRate, setCommRate] = useState<number | ''>(2.5);
  const [split, setSplit] = useState<number | ''>(70);

  if (isLoading) return <div className="p-6"><Skeleton className="h-[200px] w-full" /></div>;
  if (!opp) return <div className="p-6">Transaction not found</div>;

  const isFirm = (opp as any).tags?.includes('firm') || (opp as any).tags?.includes('Firm');
  const closeDateStr = (opp as any).customFields?.find((f: any) => f.id === 'closing_date')?.value;
  const conditionsDateStr = (opp as any).customFields?.find((f: any) => f.id === 'conditions_deadline')?.value;
  
  const closeDate = closeDateStr ? new Date(closeDateStr) : null;
  const conditionsDate = conditionsDateStr ? new Date(conditionsDateStr) : null;

  const milestones = [
    { label: 'Contract', completed: true },
    { label: 'Cond.', completed: isFirm },
    { label: 'Firm', completed: isFirm },
    { label: 'Close', completed: opp.status === 'won' }
  ];

  const price = typeof salePrice === 'number' ? salePrice : (opp.monetaryValue || 0);
  const rate = typeof commRate === 'number' ? commRate : 0;
  const splitPct = typeof split === 'number' ? split : 0;
  
  const gross = price * (rate / 100);
  const net = gross * (splitPct / 100);

  return (
    <div className="flex flex-col h-full bg-secondary/30">
      <div className="flex-none p-4 bg-background border-b sticky top-0 z-10 safe-top space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/transactions')} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{opp.name}</h1>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Money amount={opp.monetaryValue || 0} />
              <span>•</span>
              <Badge variant={isFirm ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                {isFirm ? 'Firm' : 'Cond.'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Mini Milestone Tracker */}
        <div className="flex items-center justify-between relative px-2">
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-secondary -z-10" />
          {milestones.map((m, i) => (
            <div key={m.label} className="flex flex-col items-center gap-1 bg-background px-1">
              {m.completed ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <Tabs defaultValue="overview">
            <TabsList className="w-full h-auto flex flex-wrap gap-1 p-1">
              <TabsTrigger value="overview" className="flex-1 min-w-[70px]">Info</TabsTrigger>
              <TabsTrigger value="conditions" className="flex-1 min-w-[70px]">Cond.</TabsTrigger>
              <TabsTrigger value="parties" className="flex-1 min-w-[70px]">Parties</TabsTrigger>
              <TabsTrigger value="calc" className="flex-1 min-w-[70px]">Calc</TabsTrigger>
              <TabsTrigger value="documents" className="flex-1 min-w-[70px]">Docs</TabsTrigger>
              <TabsTrigger value="tasks" className="flex-1 min-w-[70px]">Tasks</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1 min-w-[70px]">Notes</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1 min-w-[70px]">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4"/> Critical Dates</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border-2 pb-2">
                    <div className="text-sm text-muted-foreground">Conditions Deadline</div>
                    <div className="text-right">
                      {conditionsDate ? (
                        <>
                          <div className="font-medium text-sm">{format(conditionsDate, 'MMM d, h:mm a')}</div>
                          {!isPast(conditionsDate) && <Countdown targetDate={conditionsDate} className="text-xs" />}
                        </>
                      ) : <span className="text-sm">-</span>}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">Closing Date</div>
                    <div className="text-right">
                      {closeDate ? (
                        <>
                          <div className="font-medium text-sm">{format(closeDate, 'MMM d, yyyy')}</div>
                          {!isPast(closeDate) && <Countdown targetDate={closeDate} className="text-xs" />}
                        </>
                      ) : <span className="text-sm">-</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parties" className="mt-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4"/> Parties</CardTitle></CardHeader>
                <CardContent className="space-y-3">
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
            </TabsContent>

            <TabsContent value="calc" className="mt-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4"/> Commission</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Sale Price</Label>
                      <Input 
                        type="number" 
                        value={salePrice === '' ? opp.monetaryValue || '' : salePrice} 
                        onChange={e => setSalePrice(e.target.value ? Number(e.target.value) : '')} 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Rate (%)</Label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          value={commRate} 
                          onChange={e => setCommRate(e.target.value ? Number(e.target.value) : '')} 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Split (%)</Label>
                        <Input 
                          type="number" 
                          value={split} 
                          onChange={e => setSplit(e.target.value ? Number(e.target.value) : '')} 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Gross</span>
                      <span className="font-medium"><Money amount={gross} /></span>
                    </div>
                    <div className="flex justify-between items-center border-t border-border-2 pt-2">
                      <span className="text-sm font-medium">Net to Agent</span>
                      <span className="font-bold text-success text-lg"><Money amount={net} /></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="conditions" className="mt-4">
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground py-12 text-sm">
                  Conditions checklist will be loaded from associated offer.
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground py-12 text-sm">
                  Document vault integration pending.
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground py-12 text-sm">
                  Tasks integration pending.
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground py-12 text-sm">
                  Notes integration pending.
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground py-12 text-sm">
                  Activity feed integration pending.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
