import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { myListingsService } from '@/lib/ghl/services';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

export function ListingEditModal({ listing, open, onOpenChange }: { listing: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [formData, setFormData] = useState({
    address: listing.address || '',
    list_price: listing.list_price || 0,
    listing_stage: listing.listing_stage || 'Active',
    beds: listing.beds || '',
    baths: listing.baths || '',
    sqft: listing.sqft || '',
    property_type: listing.property_type || '',
    public_remarks: listing.public_remarks || ''
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Need to prefix fields with custom_objects.my_listings.
      const payload: Record<string, any> = {};
      Object.entries(data).forEach(([key, value]) => {
        payload[`custom_objects.my_listings.${key}`] = value;
      });
      return myListingsService.update(listing.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.record('my_listings', listing.id) });
      queryClient.invalidateQueries({ queryKey: ghl.records('my_listings', {}) });
      toast({ title: 'Listing updated' });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: 'Failed to update listing', variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      list_price: Number(formData.list_price),
      beds: Number(formData.beds),
      baths: Number(formData.baths),
      sqft: Number(formData.sqft)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Listing</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Address</Label>
            <Input 
              value={formData.address} 
              onChange={e => setFormData({ ...formData, address: e.target.value })} 
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>List Price</Label>
              <Input 
                type="number" 
                value={formData.list_price} 
                onChange={e => setFormData({ ...formData, list_price: Number(e.target.value) })} 
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={formData.listing_stage} onValueChange={v => setFormData({ ...formData, listing_stage: v })}>
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Beds</Label>
              <Input 
                type="number" 
                value={formData.beds} 
                onChange={e => setFormData({ ...formData, beds: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Baths</Label>
              <Input 
                type="number" 
                step="0.5"
                value={formData.baths} 
                onChange={e => setFormData({ ...formData, baths: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Sqft</Label>
              <Input 
                type="number" 
                value={formData.sqft} 
                onChange={e => setFormData({ ...formData, sqft: e.target.value })} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Property Type</Label>
            <Input 
              value={formData.property_type} 
              onChange={e => setFormData({ ...formData, property_type: e.target.value })} 
            />
          </div>

          <div className="space-y-2">
            <Label>Public Remarks</Label>
            <Textarea 
              value={formData.public_remarks} 
              onChange={e => setFormData({ ...formData, public_remarks: e.target.value })} 
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
