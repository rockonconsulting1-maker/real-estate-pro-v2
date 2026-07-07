import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { usersService } from '@/lib/ghl/services/users';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { tasksGlobalService } from '@/lib/ghl/services/tasksGlobal';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, Phone, Briefcase, CheckSquare, Users, MoreVertical, ArrowRightLeft } from 'lucide-react';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function MobileTeamView() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ghl.users(),
    queryFn: () => usersService.list(),
  });

  const { data: oppsData, isLoading: oppsLoading } = useQuery({
    queryKey: ghl.opps({ limit: 100 }),
    queryFn: () => opportunitiesService.search({ limit: 100 }),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ghl.tasks({ completed: false }),
    queryFn: () => tasksGlobalService.search({ completed: false }),
  });

  const isLoading = usersLoading || oppsLoading || tasksLoading;

  const userStats = useMemo(() => {
    const stats: Record<string, { leads: number; clients: number; tasks: number; opps: any[] }> = {};
    users.forEach(u => {
      stats[u.id as string] = { leads: 0, clients: 0, tasks: 0, opps: [] };
    });

    if (oppsData?.opportunities) {
      oppsData.opportunities.forEach(opp => {
        if (opp.assignedTo && stats[opp.assignedTo as string]) {
          stats[opp.assignedTo as string].opps.push(opp);
          const pipe = PipelineRegistry.getPipeline(opp.pipelineId);
          if (pipe?.name.toLowerCase().includes('lead')) {
            stats[opp.assignedTo as string].leads++;
          } else {
            stats[opp.assignedTo as string].clients++;
          }
        }
      });
    }

    if (tasksData?.tasks) {
      tasksData.tasks.forEach(task => {
        if (task.assignedTo && stats[task.assignedTo as string]) {
          stats[task.assignedTo as string].tasks++;
        }
      });
    }

    return stats;
  }, [users, oppsData, tasksData]);

  const reassignMutation = useMutation({
    mutationFn: async ({ fromUserId, toUserId }: { fromUserId: string, toUserId: string }) => {
      const oppsToMove = userStats[fromUserId]?.opps || [];
      const promises = oppsToMove.map(opp => 
        opportunitiesService.update(opp.id, { assignedTo: toUserId })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.opps() });
      toast.success('Successfully reassigned opportunities');
      setReassignOpen(false);
    },
    onError: (err: any) => {
      toast.error('Failed to reassign: ' + err.message);
    }
  });

  const handleReassign = () => {
    if (!selectedUser || !reassignTargetId) return;
    reassignMutation.mutate({ fromUserId: selectedUser.id, toUserId: reassignTargetId });
  };

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        <div className="p-4 bg-surface border-b shrink-0">
          <h1 className="text-xl font-bold">Team Directory</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-xl p-4 bg-surface">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No team members</h3>
            </div>
          ) : (
            users.map(user => {
              const stats = userStats[user.id] || { leads: 0, clients: 0, tasks: 0 };
              
              return (
                <div key={user.id} className="border rounded-xl bg-surface overflow-hidden">
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={(user.profilePhoto as string) || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base truncate">{user.name}</h3>
                        <div className="text-xs text-muted-foreground truncate flex items-center gap-2 mt-0.5">
                          {user.email && <span className="truncate">{user.email}</span>}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedUser(user);
                            setReassignOpen(true);
                          }}
                          disabled={stats.leads === 0 && stats.clients === 0}
                        >
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                          Reassign Work
                        </DropdownMenuItem>
                        {user.phone && (
                          <DropdownMenuItem onClick={() => window.location.href = `tel:${user.phone}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </DropdownMenuItem>
                        )}
                        {user.email && (
                          <DropdownMenuItem onClick={() => window.location.href = `mailto:${user.email}`}>
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <div className="text-sm font-semibold">{stats.leads}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Leads</div>
                      </div>
                      <div className="text-center border-l border-r border-border/50">
                        <div className="text-sm font-semibold">{stats.clients}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Clients</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold">{stats.tasks}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Tasks</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
          <DialogContent className="w-[90vw] max-w-[400px] rounded-xl">
            <DialogHeader>
              <DialogTitle>Reassign Work</DialogTitle>
              <DialogDescription>
                Move leads and clients from {selectedUser?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={reassignTargetId} onValueChange={setReassignTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.id !== selectedUser?.id).map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReassignOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button 
                onClick={handleReassign} 
                disabled={!reassignTargetId || reassignMutation.isPending}
                className="w-full sm:w-auto mt-2 sm:mt-0"
              >
                {reassignMutation.isPending ? 'Saving...' : 'Reassign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
