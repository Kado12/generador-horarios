import api from './axios';

export interface GenerateResult {
  blockId: string;
  blockName: string;
  totalSections: number;
  resolved: number;
  unresolved: { sectionId: string; sectionName: string; reason: string }[];
  totalSessions: number;
  teachersUsed: string[];
  generatedAt: string;
}

export interface SessionRow {
  id: string;
  dayOfWeek: number;
  slot: number;
  section: {
    id: string;
    name: string;
    turno: { name: string };
    classroom: { name: string; sede: { name: string } };
  };
  course: { id: string; name: string };
  teacher: { id: string; firstName: string; lastName: string; dni: string };
}

export const schedulerService = {
  async generate(blockId: string): Promise<GenerateResult> {
    return (await api.post(`/api/scheduler/generate/${blockId}`)).data;
  },
  async getResult(blockId: string): Promise<SessionRow[]> {
    return (await api.get(`/api/scheduler/result/${blockId}`)).data;
  },
  async clear(blockId: string) {
    return (await api.delete(`/api/scheduler/clear/${blockId}`)).data;
  },
  async exportExcel(blockId: string) {
    const res = await api.get(`/api/scheduler/export/${blockId}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `horario_bloque.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  },
};