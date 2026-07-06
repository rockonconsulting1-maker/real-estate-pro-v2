import React from 'react';
import { Contact, Opportunity, GhlTask, GhlNote, Appointment } from '@/types/ghl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, CalendarIcon, FileText, Upload } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Money } from '@/components/shared/primitives';

interface TabProps {
  contact: Contact;
  opp: Opportunity;
  tasks?: GhlTask[];
  notes?: GhlNote[];
  appointments?: Appointment[];
}

export function SellerOverviewTab({ contact, opp }: TabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-medium">Seller Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Motivation</Label>
            <Input defaultValue={(contact.customFields as any)?.seller_motivation || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Target Price</Label>
            <Input defaultValue={(contact.customFields as any)?.target_price || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Urgency</Label>
            <Input defaultValue={(contact.customFields as any)?.urgency || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Property Address</Label>
            <Input defaultValue={(contact.customFields as any)?.property_address || ''} readOnly />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SellerListingTab({ contact, opp }: TabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Listing Details</h3>
        <Button size="sm" variant="outline">Edit Listing</Button>
      </div>
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted-foreground">
        <p>No associated listing found.</p>
      </div>
    </div>
  );
}

export function SellerOffersTab({ contact, opp }: TabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Offers</h3>
        <Button size="sm" variant="outline">Add Offer</Button>
      </div>
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted-foreground">
        <p>No offers received yet.</p>
      </div>
    </div>
  );
}

export function SellerShowingsTab({ appointments }: TabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Showings</h3>
        <Button size="sm"><CalendarIcon className="w-4 h-4 mr-2" /> Schedule Showing</Button>
      </div>
      {!appointments || appointments.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">No showings scheduled</div>
      ) : (
        <div className="space-y-3">
          {appointments.map(a => (
            <div key={a.id} className="p-4 bg-surface border border-border rounded-lg flex justify-between items-center">
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="text-sm text-muted-foreground">{format(new Date(a.startTime), 'MMM d, yyyy h:mm a')}</div>
              </div>
              <Badge variant="secondary">{a.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SellerMarketingTab() {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Marketing Stats</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Listing Views</span>
          <span className="font-semibold text-xl">-</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Saves / Favorites</span>
          <span className="font-semibold text-xl">-</span>
        </div>
      </div>
    </div>
  );
}

export function SellerTasksTab({ tasks }: TabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Tasks</h3>
        <Button size="sm"><CheckSquare className="w-4 h-4 mr-2" /> Add Task</Button>
      </div>
      {!tasks || tasks.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">No tasks found</div>
      ) : (
        <div className="space-y-2">
          {tasks.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg">
              <input type="checkbox" checked={t.completed} readOnly className="w-4 h-4 rounded border-border" />
              <div className="flex-1">
                <div className={`font-medium ${t.completed ? 'line-through text-muted-foreground' : ''}`}>{t.title}</div>
                {t.dueDate && <div className="text-xs text-muted-foreground">{format(new Date(t.dueDate), 'MMM d, yyyy')}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SellerNotesTab({ notes }: TabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Notes</h3>
        <Button size="sm"><FileText className="w-4 h-4 mr-2" /> Add Note</Button>
      </div>
      {!notes || notes.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">No notes found</div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <div key={n.id} className="p-4 bg-surface border border-border rounded-lg">
              <div className="text-sm whitespace-pre-wrap">{n.body}</div>
              {n.dateAdded && <div className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(new Date(n.dateAdded), { addSuffix: true })}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SellerActivityTab() {
  return (
    <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
      Activity timeline coming soon
    </div>
  );
}

export function SellerDocumentsTab() {
  return (
    <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
      Documents coming soon
    </div>
  );
}
