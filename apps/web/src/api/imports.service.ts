import api from './axios';

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export const importsService = {
  async downloadTemplate(type: string) {
    const res = await api.get(`/api/imports/template/${type}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plantilla-${type}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  async importFile(type: string, file: File): Promise<ImportResult> {
    const fd = new FormData();
    fd.append('file', file);
    return (await api.post(`/api/imports/${type}`, fd)).data;
  },
};