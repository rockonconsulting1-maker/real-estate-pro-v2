export const ghl = {
  pipelines: () => ['ghl', 'pipelines'] as const,
  schemas: () => ['ghl', 'schemas'] as const,
  fields: () => ['ghl', 'fields'] as const,
  assocKeys: () => ['ghl', 'assocKeys'] as const,
  users: () => ['ghl', 'users'] as const,
  tags: () => ['ghl', 'tags'] as const,
  calendars: () => ['ghl', 'calendars'] as const,
  contacts: (params?: Record<string, unknown>) => ['ghl', 'contacts', params] as const,
  contact: (id: string) => ['ghl', 'contact', id] as const,
  opps: (params?: Record<string, unknown>) => ['ghl', 'opps', params] as const,
  opp: (id: string) => ['ghl', 'opp', id] as const,
  records: (schema: string, params?: Record<string, unknown>) => ['ghl', 'records', schema, params] as const,
  record: (schema: string, id: string) => ['ghl', 'record', schema, id] as const,
  relations: (recordId: string) => ['ghl', 'relations', recordId] as const,
  conversations: (params?: Record<string, unknown>) => ['ghl', 'conversations', params] as const,
  messages: (id: string) => ['ghl', 'messages', id] as const,
  events: (range?: Record<string, unknown>) => ['ghl', 'events', range] as const,
  tasks: (params?: Record<string, unknown>) => ['ghl', 'tasks', params] as const,
  notes: (contactId: string) => ['ghl', 'notes', contactId] as const,
  contactAppointments: (contactId: string) => ['ghl', 'contactAppointments', contactId] as const,
};

export const sb = {
  profile: () => ['sb', 'profile'] as const,
  creds: () => ['sb', 'credentials'] as const,
  docs: (params?: Record<string, unknown>) => ['sb', 'docs', params] as const,
};

export const STALE_TIMES = {
  SCHEMA: 1000 * 60 * 60 * 24, // 24h
  LIST: 1000 * 60, // 60s
  DETAIL: 1000 * 30, // 30s
  MESSAGES: 1000 * 15, // 15s
};
