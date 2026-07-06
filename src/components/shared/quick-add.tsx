import React, { createContext, useContext, useState } from 'react';
import { NewLeadSheet } from '@/features/leads/components/new-lead-sheet';
import { NewClientSheet } from '@/features/clients/components/new-client-sheet';
import { NewContactSheet } from '@/features/contacts/components/contact-modals';
import { NewListingModal } from '@/features/listings/components/new-listing-sheet';
import { NewOfferModal } from '@/features/offers/components/new-offer-sheet';
import { NewTaskModal } from '@/features/tasks/components/task-modals';
import { NewNoteModal } from '@/features/notes/components/note-modals';
import { NewEventModal } from '@/features/calendar/components/event-modals';

type ModalType = 'lead' | 'client' | 'contact' | 'listing' | 'offer' | 'task' | 'note' | 'event' | null;

interface QuickAddContextValue {
  openModal: (type: ModalType) => void;
  closeModal: () => void;
}

const QuickAddContext = createContext<QuickAddContextValue | undefined>(undefined);

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const openModal = (type: ModalType) => setActiveModal(type);
  const closeModal = () => setActiveModal(null);

  return (
    <QuickAddContext.Provider value={{ openModal, closeModal }}>
      {children}
      <NewLeadSheet open={activeModal === 'lead'} onOpenChange={(o) => !o && closeModal()} />
      <NewClientSheet open={activeModal === 'client'} onOpenChange={(o) => !o && closeModal()} />
      <NewContactSheet open={activeModal === 'contact'} onOpenChange={(o) => !o && closeModal()} />
      <NewListingModal open={activeModal === 'listing'} onOpenChange={(o) => !o && closeModal()} />
      <NewOfferModal open={activeModal === 'offer'} onOpenChange={(o) => !o && closeModal()} />
      <NewTaskModal open={activeModal === 'task'} onOpenChange={(o) => !o && closeModal()} />
      <NewNoteModal open={activeModal === 'note'} onOpenChange={(o) => !o && closeModal()} />
      <NewEventModal open={activeModal === 'event'} onOpenChange={(o) => !o && closeModal()} />
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const context = useContext(QuickAddContext);
  if (context === undefined) {
    throw new Error('useQuickAdd must be used within a QuickAddProvider');
  }
  return context;
}
