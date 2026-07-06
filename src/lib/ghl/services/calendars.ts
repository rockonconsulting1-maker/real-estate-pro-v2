import { ghlFetch, getGhlCredentials } from '../client';
import { Calendar, calendarSchema, Appointment, appointmentSchema } from '@/types/ghl';

export const calendarsService = {
  async list(): Promise<Calendar[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>('/calendars/', {
      query: { locationId }
    });
    return (result.calendars || []).map((c: any) => calendarSchema.parse(c));
  },

  async eventsByRange(startTime: string, endTime: string): Promise<Appointment[]> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<any>('/calendars/events', {
      query: { locationId, startTime, endTime }
    });
    return (result.events || []).map((e: any) => appointmentSchema.parse(e));
  },

  async getAppointment(id: string): Promise<Appointment> {
    const result = await ghlFetch<{appointment: any}>(`/calendars/events/${id}`);
    return appointmentSchema.parse(result.appointment);
  },

  async createAppointment(data: Partial<Appointment>): Promise<Appointment> {
    const { locationId } = getGhlCredentials();
    const result = await ghlFetch<{appointment: any}>('/calendars/events', {
      method: 'POST',
      body: { ...data, locationId }
    });
    return appointmentSchema.parse(result.appointment);
  },

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const result = await ghlFetch<{appointment: any}>(`/calendars/events/${id}`, {
      method: 'PUT',
      body: data
    });
    return appointmentSchema.parse(result.appointment);
  },

  async deleteAppointment(id: string): Promise<void> {
    await ghlFetch(`/calendars/events/${id}`, { method: 'DELETE' });
  }
};
