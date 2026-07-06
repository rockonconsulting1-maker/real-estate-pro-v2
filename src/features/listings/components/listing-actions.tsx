import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { myListingsService } from '@/lib/ghl/services';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export function ChangeStageModal({ listing, open, onOpenChange }: { listing: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [stage, setStage] = useState(listing.listing_stage || 'Coming Soon');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (newStage: string) => {
      return myListingsService.update(listing.id, {
        'custom_objects.my_listings.listing_stage': newStage,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.record('my_listings', listing.id) });
      queryClient.invalidateQueries({ queryKey: ghl.records('my_listings', {}) });
      toast({ title: 'Stage updated' });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: 'Failed to update stage', variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Change Listing Stage</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>New Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Coming Soon">Coming Soon</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate(stage)} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ChangePriceModal({ listing, open, onOpenChange }: { listing: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [price, setPrice] = useState(listing.list_price || 0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (newPrice: number) => {
      // Record old price in history if possible, for now just update price
      return myListingsService.update(listing.id, {
        'custom_objects.my_listings.list_price': newPrice,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.record('my_listings', listing.id) });
      queryClient.invalidateQueries({ queryKey: ghl.records('my_listings', {}) });
      toast({ title: 'Price updated' });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: 'Failed to update price', variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Change List Price</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>New Price</Label>
            <Input 
              type="number" 
              value={price} 
              onChange={(e) => setPrice(Number(e.target.value))} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate(price)} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
