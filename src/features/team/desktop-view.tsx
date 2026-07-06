import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { usersService } from '@/lib/ghl/services/users';
import { opportunitiesService } from '@/lib/ghl/services/opportunities';
import { tasksGlobalService } from '@/lib/ghl/services/tasksGlobal';
import { DesktopShell } from '@/components/desktop/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, Phone, Briefcase, CheckSquare, Users } from 'lucide-react';
import { PipelineRegistry } from '@/lib/pipeline-registry';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function DesktopTeamView() {
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
    <DesktopShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-page-title-desktop">Team Directory</h1>
          <p className="text-muted-foreground text-sm">Manage team members and reassign work.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 border rounded-xl bg-surface">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No team members found</h3>
            <p className="text-muted-foreground">Check your GHL account settings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => {
              const stats = userStats[user.id] || { leads: 0, clients: 0, tasks: 0 };
              
              return (
                <Card key={user.id} className="overflow-hidden">
                  <CardHeader className="pb-4 border-b bg-muted/20">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                        <AvatarImage src={(user.profilePhoto as string) || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{user.name}</CardTitle>
                          <div className="text-sm text-muted-foreground mt-0.5">
                            {user.roles?.type === 'agency' ? 'Agency Admin' : 'Location User'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2 text-sm">
                      {user.email && (
                        <div className="flex items-center text-muted-foreground">
                          <Mail className="h-4 w-4 mr-2 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center text-muted-foreground">
                          <Phone className="h-4 w-4 mr-2 shrink-0" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                      <div className="text-center p-2 bg-muted/30 rounded-lg">
                        <div className="text-lg font-semibold text-foreground">{stats.leads}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                          <Users className="h-3 w-3" /> Leads
                        </div>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded-lg">
                        <div className="text-lg font-semibold text-foreground">{stats.clients}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                          <Briefcase className="h-3 w-3" /> Clients
                        </div>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded-lg">
                        <div className="text-lg font-semibold text-foreground">{stats.tasks}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                          <CheckSquare className="h-3 w-3" /> Tasks
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full mt-2" 
                      onClick={() => {
                        setSelectedUser(user);
                        setReassignOpen(true);
                      }}
                      disabled={stats.leads === 0 && stats.clients === 0}
                    >
                      Reassign Work
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reassign Work</DialogTitle>
              <DialogDescription>
                Move all active leads and clients from {selectedUser?.name} to another team member.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reassign to</label>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReassignOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleReassign} 
                disabled={!reassignTargetId || reassignMutation.isPending}
              >
                {reassignMutation.isPending ? 'Reassigning...' : 'Confirm Reassignment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DesktopShell>
  );
}
