import api from './axios';
import { Course } from './academic.service';
import { Sede, Turno } from './structure.service';

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone?: string;
  email?: string;
  maxSessionsPerWeek?: number | null;
  isActive: boolean;
  courses: { course: Course }[];
  turnos: { turno: Turno }[];
  sedes: { sede: Sede }[];
  unavailableDays: { dayOfWeek: number }[];
}

export const teachersService = {
  async list(search?: string): Promise<Teacher[]> {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return (await api.get(`/api/teachers${q}`)).data;
  },
  async findOne(id: string): Promise<Teacher> {
    return (await api.get(`/api/teachers/${id}`)).data;
  },
  async create(data: any) {
    return (await api.post('/api/teachers', data)).data;
  },
  async update(id: string, data: any) {
    return (await api.patch(`/api/teachers/${id}`, data)).data;
  },
  async toggleActive(id: string) {
    return (await api.patch(`/api/teachers/${id}/toggle`, {})).data;
  },
  async delete(id: string) {
    return (await api.delete(`/api/teachers/${id}`)).data;
  },
  async addCourse(id: string, courseId: string) {
    return (await api.post(`/api/teachers/${id}/courses/${courseId}`, {})).data;
  },
  async removeCourse(id: string, courseId: string) {
    return (await api.delete(`/api/teachers/${id}/courses/${courseId}`)).data;
  },
  async setTurnos(id: string, turnoIds: string[]) {
    return (await api.put(`/api/teachers/${id}/turnos`, { turnoIds })).data;
  },
  async setSedes(id: string, sedeIds: string[]) {
    return (await api.put(`/api/teachers/${id}/sedes`, { sedeIds })).data;
  },
  async setUnavailableDays(id: string, days: number[]) {
    return (await api.put(`/api/teachers/${id}/unavailable-days`, { days })).data;
  },
};