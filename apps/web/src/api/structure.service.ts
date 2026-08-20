import api from './axios';

export interface Sede {
  id: string;
  name: string;
  classrooms: Classroom[];
}

export interface Classroom {
  id: string;
  name: string;
  sedeId: string;
  sections: Section[];
}

export interface Section {
  id: string;
  name: string;
  classroomId: string;
  turnoId: string;
  turno: Turno;
}

export interface Turno {
  id: string;
  name: string;
  slot1Start: string;
  slot1End: string;
  slot2Start: string;
  slot2End: string;
}

export const structureService = {
  // Sedes
  async listSedes(): Promise<Sede[]> {
    return (await api.get('/api/structure/sedes')).data;
  },
  async createSede(name: string) {
    return (await api.post('/api/structure/sedes', { name })).data;
  },
  async deleteSede(id: string) {
    return (await api.delete(`/api/structure/sedes/${id}`)).data;
  },
  // Turnos
  async listTurnos(): Promise<Turno[]> {
    return (await api.get('/api/structure/turnos')).data;
  },
  async createTurno(data: { name: string; slot1Start: string; slot1End: string; slot2Start: string; slot2End: string }) {
    return (await api.post('/api/structure/turnos', data)).data;
  },
  async deleteTurno(id: string) {
    return (await api.delete(`/api/structure/turnos/${id}`)).data;
  },
  // Salones
  async createClassroom(name: string, sedeId: string, turnoIds: string[]) {
    return (await api.post('/api/structure/classrooms', { name, sedeId, turnoIds })).data;
  },
  async deleteClassroom(id: string) {
    return (await api.delete(`/api/structure/classrooms/${id}`)).data;
  },
};