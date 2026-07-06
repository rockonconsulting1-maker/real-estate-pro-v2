import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '@/lib/navigation';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface MoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const navigate = useNavigate();

  // Exclude items already in the TabBar
  const excludePaths = ['/', '/leads', '/clients', '/calendar'];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left border-b border-border pb-4">
          <DrawerTitle>More Modules</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto p-4 space-y-6">
          {NAVIGATION_ITEMS.map((group, i) => {
            const filteredItems = group.items.filter(item => !excludePaths.includes(item.path));
            if (filteredItems.length === 0) return null;

            return (
              <div key={i}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.group}
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {filteredItems.map(item => (
                    <button
                      key={item.name}
                      onClick={() => {
                        onOpenChange(false);
                        navigate(item.path);
                      }}
                      className="flex flex-col items-center gap-2 touch-target"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-medium text-center leading-tight">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
