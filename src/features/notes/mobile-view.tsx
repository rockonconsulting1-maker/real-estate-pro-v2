import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { contactsService } from '@/lib/ghl/services/contacts';
import { notesService } from '@/lib/ghl/services/notes';

import { Button } from '@/components/ui/button';
import { Plus, User, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { NewNoteModal, NoteDetailModal } from './components/note-modals';
import { Input } from '@/components/ui/input';

export function MobileNotesView() {
  const [search, setSearch] = useState('');
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);

  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ghl.contacts({ limit: 20 }),
    queryFn: () => contactsService.search({ limit: 20 }),
    staleTime: 60000,
  });

  const contacts = contactsData?.contacts || [];

  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['global-notes', contacts.map(c => c.id)],
    queryFn: async () => {
      if (contacts.length === 0) return [];
      const promises = contacts.map(c => 
        notesService.list(c.id).then(notes => 
          notes.map(n => ({ ...n, contact: c }))
        ).catch(() => [])
      );
      const results = await Promise.all(promises);
      return results.flat().sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    },
    enabled: contacts.length > 0,
    staleTime: 60000,
  });

  const isLoading = contactsLoading || notesLoading;
  const allNotes = notesData || [];

  const filteredNotes = allNotes.filter(n => 
    (n.body || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.contact?.contactName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="p-4 space-y-4">
        <Input 
          placeholder="Search notes..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-surface"
        />

        <div className="space-y-3 pb-24">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-xl bg-surface">
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No notes found.</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <div 
                key={note.id} 
                className="p-4 border rounded-xl bg-surface active:bg-muted transition-colors"
                onClick={() => setSelectedNote(note)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                      <User className="h-3 w-3" />
                      {note.contact.contactName}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {note.createdAt ? format(new Date(note.createdAt), 'MMM d') : ''}
                  </span>
                </div>
                <p className="text-sm line-clamp-3">{note.body}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="fixed bottom-20 right-4 z-50">
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsNewOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <NewNoteModal 
        open={isNewOpen} 
        onOpenChange={setIsNewOpen} 
      />
      
      {selectedNote && (
        <NoteDetailModal 
          note={selectedNote} 
          open={!!selectedNote} 
          onOpenChange={(open) => !open && setSelectedNote(null)} 
        />
      )}
    </>
  );
}
