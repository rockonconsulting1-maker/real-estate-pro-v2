import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { contactsService } from '@/lib/ghl/services/contacts';
import { notesService } from '@/lib/ghl/services/notes';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, User, FileText, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { NewNoteModal, NoteDetailModal } from './components/note-modals';

export function DesktopNotesView() {
  const [search, setSearch] = useState('');
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);

  // 1. Fetch recent contacts
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ghl.contacts({ limit: 20 }),
    queryFn: () => contactsService.search({ limit: 20 }),
    staleTime: 60000,
  });

  const contacts = contactsData?.contacts || [];

  // 2. Fetch notes for these contacts
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

  // Filter
  const filteredNotes = allNotes.filter(n => 
    (n.body || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.contact?.contactName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="p-6 border-b shrink-0 flex items-center justify-between bg-surface">
          <div>
            <h1 className="text-page-title-desktop">Notes</h1>
            <p className="text-muted-foreground text-sm">Global feed of recent notes.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search notes..." 
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsNewOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-4xl mx-auto space-y-4">
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
                <h3 className="text-lg font-medium">No notes found</h3>
                <p className="text-muted-foreground">Try adjusting your search or create a new note.</p>
              </div>
            ) : (
              filteredNotes.map(note => (
                <div 
                  key={note.id} 
                  className="p-4 border rounded-xl bg-surface hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/contacts/${note.contact.id}`} 
                        className="text-sm font-medium hover:text-brand flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full"
                        onClick={e => e.stopPropagation()}
                      >
                        <User className="h-3 w-3" />
                        {note.contact.contactName}
                      </Link>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {note.createdAt ? format(new Date(note.createdAt), 'MMM d, yyyy h:mm a') : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
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
