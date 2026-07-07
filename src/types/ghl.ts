import { z } from 'zod';

// Base types
export const ghlMetaSchema = z.object({
  total: z.number().optional(),
  nextPageUrl: z.string().nullable().optional(),
  startAfter: z.string().nullable().optional(),
  startAfterId: z.string().nullable().optional(),
  currentPage: z.number().optional(),
  nextPage: z.number().nullable().optional(),
  prevPage: z.number().nullable().optional(),
});

// Contacts
export const contactSchema = z.object({
  id: z.string(),
  locationId: z.string(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  companyName: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  dateAdded: z.string().optional(),
  dateUpdated: z.string().optional(),
}).passthrough();

export type Contact = z.infer<typeof contactSchema>;

// Opportunities (Pipelines)
export const opportunitySchema = z.object({
  id: z.string(),
  pipelineId: z.string(),
  pipelineStageId: z.string(),
  name: z.string(),
  status: z.enum(['open', 'won', 'lost', 'abandoned', 'all']).optional(),
  monetaryValue: z.number().optional(),
  contactId: z.string().optional(),
  assignedTo: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

export type Opportunity = z.infer<typeof opportunitySchema>;

export const pipelineStageSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const pipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  stages: z.array(pipelineStageSchema).optional(),
});

export type Pipeline = z.infer<typeof pipelineSchema>;
export type Stage = z.infer<typeof pipelineStageSchema>;

// Custom Objects (Generic)
export const customObjectRecordSchema = z.object({
  id: z.string(),
  locationId: z.string(),
  name: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

export type CustomObjectRecord = z.infer<typeof customObjectRecordSchema>;

// Strip custom_objects.<key>. prefix from fields
export function cleanCustomObjectFields(record: Record<string, any>, objectKey: string): Record<string, any> {
  const prefix = `custom_objects.${objectKey}.`;
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith(prefix)) {
      cleaned[key.replace(prefix, '')] = value;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export type ListingRecord = CustomObjectRecord & Record<string, any>;
export type PropertyRecord = CustomObjectRecord & Record<string, any>;
export type OfferRecord = CustomObjectRecord & Record<string, any>;

// Conversations
export const conversationSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  locationId: z.string(),
  lastMessageBody: z.string().nullable().optional(),
  lastMessageType: z.string().nullable().optional(),
  lastMessageDate: z.string().nullable().optional(),
  unreadCount: z.number().optional(),
  type: z.number().optional(), // e.g. SMS, Email, etc.
}).passthrough();

export type Conversation = z.infer<typeof conversationSchema>;

export const messageSchema = z.object({
  id: z.string(),
  type: z.number(),
  messageType: z.string(),
  subject: z.string().nullable().optional(),
  body: z.string(),
  direction: z.enum(['inbound', 'outbound']),
  status: z.string(),
  dateAdded: z.string(),
  contactId: z.string(),
  conversationId: z.string(),
}).passthrough();

export type Message = z.infer<typeof messageSchema>;

// Calendars & Appointments
export const calendarSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  locationId: z.string(),
}).passthrough();

export type Calendar = z.infer<typeof calendarSchema>;

export const appointmentSchema = z.object({
  id: z.string(),
  calendarId: z.string(),
  locationId: z.string(),
  contactId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  title: z.string(),
  status: z.string(),
}).passthrough();

export type Appointment = z.infer<typeof appointmentSchema>;

// Tasks
export const ghlTaskSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  title: z.string(),
  body: z.string().nullable().optional(),
  dueDate: z.string(),
  completed: z.boolean(),
  status: z.string(),
}).passthrough();

export type GhlTask = z.infer<typeof ghlTaskSchema>;

// Notes
export const ghlNoteSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  body: z.string(),
  dateAdded: z.string().optional(),
}).passthrough();

export type GhlNote = z.infer<typeof ghlNoteSchema>;

// Users
export const ghlUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  roles: z.record(z.string(), z.any()).optional(),
}).passthrough();

export type GhlUser = z.infer<typeof ghlUserSchema>;

// Associations
export const associationKeySchema = z.object({
  id: z.string(),
  name: z.string(),
}).passthrough();
export type AssociationKey = z.infer<typeof associationKeySchema>;

export const relationSchema = z.object({
  id: z.string(),
  contactId: z.string().optional(),
  opportunityId: z.string().optional(),
  objectId: z.string().optional(),
  recordId: z.string().optional(),
  linkedRecordId: z.string().optional(),
}).passthrough();
export type Relation = z.infer<typeof relationSchema>;

// Misc
export const customFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  dataType: z.string(),
  placeholder: z.string().optional().nullable(),
}).passthrough();
export type CustomField = z.infer<typeof customFieldSchema>;

export const customValueSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.string(),
}).passthrough();
export type CustomValue = z.infer<typeof customValueSchema>;

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
}).passthrough();
export type Tag = z.infer<typeof tagSchema>;

export const mediaFileSchema = z.object({
  id: z.string(),
  url: z.string(),
  name: z.string(),
  type: z.string(),
}).passthrough();
export type MediaFile = z.infer<typeof mediaFileSchema>;

export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  body: z.string().optional(),
}).passthrough();
export type Template = z.infer<typeof templateSchema>;

export const locationSchema = z.object({
  id: z.string(),
  name: z.string(),
  companyId: z.string().optional(),
}).passthrough();
export type Location = z.infer<typeof locationSchema>;