import React from 'react';
import { Users, UserSquare2, Home, FileText, CheckSquare, StickyNote, Calendar } from 'lucide-react';
import { useQuickAdd } from '@/components/shared/quick-add';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface FabPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FAB_ACTIONS = [
  { name: 'Lead', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', type: 'lead' },
  { name: 'Client', icon: UserSquare2, color: 'text-green-500', bg: 'bg-green-500/10', type: 'client' },
  { name: 'Contact', icon: Users, color: 'text-teal-500', bg: 'bg-teal-500/10', type: 'contact' },
  { name: 'Listing', icon: Home, color: 'text-purple-500', bg: 'bg-purple-500/10', type: 'listing' },
  { name: 'Offer', icon: FileText, color: 'text-orange-500', bg: 'bg-orange-500/10', type: 'offer' },
  { name: 'Task', icon: CheckSquare, color: 'text-red-500', bg: 'bg-red-500/10', type: 'task' },
  { name: 'Note', icon: StickyNote, color: 'text-yellow-500', bg: 'bg-yellow-500/10', type: 'note' },
  { name: 'Event', icon: Calendar, color: 'text-indigo-500', bg: 'bg-indigo-500/10', type: 'event' },
];

export function FabPicker({ open, onOpenChange }: FabPickerProps) {
  const { openModal } = useQuickAdd();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left border-b border-border pb-4">
          <DrawerTitle>Create New</DrawerTitle>
        </DrawerHeader>
        <div className="p-6 grid grid-cols-4 gap-y-6 gap-x-4">
          {FAB_ACTIONS.map((action) => (
            <button
              key={action.name}
              onClick={() => {
                onOpenChange(false);
                openModal(action.type as any);
              }}
              className="flex flex-col items-center gap-2 touch-target"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${action.bg} ${action.color}`}>
                <action.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-foreground">{action.name}</span>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
