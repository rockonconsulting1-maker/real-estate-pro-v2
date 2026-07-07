import { ghlFetch, getGhlCredentials } from '../client';
import { Calendar, calendarSchema, Appointment, appointmentSchema } from '@/types/ghl';

export const calendarsService = {
  async list(): Promise<Calendar[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{ calendars: unknown[] }>('/calendars/', {
      query: { locationId }
    });
    return (result.calendars || []).map((c) => calendarSchema.parse(c));
  },

  async eventsByRange(params: { start: Date; end: Date; calendarId?: string; userId?: string }): Promise<Appointment[]> {
    if (!params.calendarId && !params.userId) {
      console.warn('[calendarsService.eventsByRange] Called without calendarId or userId!', params);
      return [];
    }
    
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{ events: unknown[] }>('/calendars/events', {
      query: { 
        locationId, 
        startTime: params.start.getTime().toString(), 
        endTime: params.end.getTime().toString(),
        calendarId: params.calendarId,
        userId: params.userId
      }
    });
    return (result.events || []).map((e) => appointmentSchema.parse(e));
  },

  async getAppointment(id: string): Promise<Appointment> {
    const result = await ghlFetch<{appointment: unknown}>(`/calendars/events/appointments/${id}`);
    return appointmentSchema.parse(result.appointment);
  },

  async createAppointment(data: Partial<Appointment>): Promise<Appointment> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{appointment: unknown}>('/calendars/events/appointments', {
      method: 'POST',
      body: { ...data, locationId }
    });
    return appointmentSchema.parse(result.appointment);
  },

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const result = await ghlFetch<{appointment: unknown}>(`/calendars/events/appointments/${id}`, {
      method: 'PUT',
      body: data
    });
    return appointmentSchema.parse(result.appointment);
  },

  async deleteAppointment(id: string): Promise<void> {
    await ghlFetch(`/calendars/events/${id}`, { method: 'DELETE' });
  }
};
