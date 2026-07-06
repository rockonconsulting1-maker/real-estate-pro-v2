import React from 'react';
import { Contact, Opportunity, GhlTask, GhlNote, Appointment } from '@/types/ghl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, CalendarIcon, FileText } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface TabProps {
  contact: Contact;
  opp: Opportunity;
  tasks?: GhlTask[];
  notes?: GhlNote[];
  appointments?: Appointment[];
}

export function BuyerOverviewTab({ contact, opp }: TabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-medium">Buyer Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue={contact.email || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input defaultValue={contact.phone || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Pre-Approval Status</Label>
            <Input defaultValue={(contact.customFields as any)?.pre_approval ? 'Approved' : 'Pending'} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Lender</Label>
            <Input defaultValue={(contact.customFields as any)?.lender || ''} readOnly />
          </div>
        </div>
      </div>
      
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-medium">Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Must Haves</Label>
            <Input defaultValue={(contact.customFields as any)?.must_haves || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Deal Breakers</Label>
            <Input defaultValue={(contact.customFields as any)?.deal_breakers || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Timeline</Label>
            <Input defaultValue={(contact.customFields as any)?.timeline || ''} readOnly />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BuyerOffersTab({ contact, opp }: TabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Offers</h3>
        <Button size="sm" variant="outline">New Offer</Button>
      </div>
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted-foreground">
        <p>No offers found.</p>
      </div>
    </div>
  );
}

export function BuyerAppointmentsTab({ appointments }: TabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Appointments</h3>
        <Button size="sm"><CalendarIcon className="w-4 h-4 mr-2" /> New Event</Button>
      </div>
      {!appointments || appointments.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">No appointments found</div>
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

export function BuyerTasksTab({ tasks }: TabProps) {
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

export function BuyerNotesTab({ notes }: TabProps) {
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

export function BuyerActivityTab() {
  return (
    <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
      Activity timeline coming soon
    </div>
  );
}

export function BuyerDocumentsTab() {
  return (
    <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
      Documents coming soon
    </div>
  );
}

export function BuyerPropertiesTab({ contact, opp }: TabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Saved Properties</h3>
        <Button size="sm" variant="outline">Add Property</Button>
      </div>
      
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted-foreground">
        <p>No associated properties yet.</p>
        <p className="text-sm mt-1">Properties saved from the MLS or viewed will appear here.</p>
      </div>
    </div>
  );
}
