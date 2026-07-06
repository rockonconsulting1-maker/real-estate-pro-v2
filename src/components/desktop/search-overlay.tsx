import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 border-0 bg-surface shadow-2xl">
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <input
            autoFocus
            placeholder="Search contacts, leads, listings..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none border-0 focus:ring-0 text-lg"
          />
        </div>
        <div className="p-4 min-h-[300px]">
          <div className="text-sm text-muted-foreground mb-4">Recent Searches</div>
          <div className="text-sm text-muted-foreground italic text-center mt-10">
            Search functionality will be wired in Phase 2
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
