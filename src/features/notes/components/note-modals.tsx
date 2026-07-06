import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { notesService } from '@/lib/ghl/services/notes';
import { contactsService } from '@/lib/ghl/services/contacts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSurface } from '@/hooks/use-surface';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

function ContactSelector({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  
  const { data } = useQuery({
    queryKey: ghl.contacts({ limit: 50 }),
    queryFn: () => contactsService.search({ limit: 50 })
  });

  const contacts = (data?.contacts || []) as any[];
  const selectedContact = contacts.find(c => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedContact ? selectedContact.contactName : "Select contact..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search contacts..." />
          <CommandList>
            <CommandEmpty>No contact found.</CommandEmpty>
            <CommandGroup>
              {contacts.map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={contact.contactName}
                  onSelect={() => {
                    onChange(contact.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === contact.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {contact.contactName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function NewNoteModal({ open, onOpenChange, defaultContactId }: { open: boolean, onOpenChange: (o: boolean) => void, defaultContactId?: string }) {
  const surface = useSurface();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [contactId, setContactId] = useState(defaultContactId || '');

  const createNote = useMutation({
    mutationFn: async () => {
      if (!contactId || !body.trim()) throw new Error('Missing fields');
      return notesService.create(contactId, { body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.notes(contactId) });
      queryClient.invalidateQueries({ queryKey: ['global-notes'] });
      toast.success('Note created');
      onOpenChange(false);
      setBody('');
    },
    onError: () => toast.error('Failed to create note')
  });

  const handleSave = () => createNote.mutate();

  const content = (
    <div className="space-y-4 py-4">
      {!defaultContactId && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Link to Contact</label>
          <ContactSelector value={contactId} onChange={setContactId} />
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium">Note Body</label>
        <Textarea 
          placeholder="Write your note here..." 
          value={body}
          onChange={e => setBody(e.target.value)}
          className="min-h-[150px]"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={handleSave} disabled={createNote.isPending || !body.trim() || !contactId}>
          Save Note
        </Button>
      </div>
    </div>
  );

  if (surface === 'desktop') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Note</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>New Note</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}

export function NoteDetailModal({ note, open, onOpenChange }: { note: any, open: boolean, onOpenChange: (o: boolean) => void }) {
  const surface = useSurface();
  const queryClient = useQueryClient();
  const [body, setBody] = useState(note?.body || '');
  const [isEditing, setIsEditing] = useState(false);

  const updateNote = useMutation({
    mutationFn: () => notesService.update(note.contact.id, note.id, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.notes(note.contact.id) });
      queryClient.invalidateQueries({ queryKey: ['global-notes'] });
      toast.success('Note updated');
      setIsEditing(false);
    },
    onError: () => toast.error('Failed to update note')
  });

  const deleteNote = useMutation({
    mutationFn: () => notesService.delete(note.contact.id, note.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ghl.notes(note.contact.id) });
      queryClient.invalidateQueries({ queryKey: ['global-notes'] });
      toast.success('Note deleted');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to delete note')
  });

  const content = (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Note Body</label>
        {isEditing ? (
          <Textarea 
            value={body}
            onChange={e => setBody(e.target.value)}
            className="min-h-[150px]"
          />
        ) : (
          <div className="p-4 bg-muted/50 rounded-md whitespace-pre-wrap text-sm min-h-[100px]">
            {note?.body}
          </div>
        )}
      </div>
      <div className="flex justify-between pt-4">
        <Button variant="destructive" size="icon" onClick={() => deleteNote.mutate()} disabled={deleteNote.isPending}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => { setIsEditing(false); setBody(note.body); }}>Cancel</Button>
              <Button onClick={() => updateNote.mutate()} disabled={updateNote.isPending || !body.trim()}>Save</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={() => setIsEditing(true)}>Edit Note</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (surface === 'desktop') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Note Details</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Note Details</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
