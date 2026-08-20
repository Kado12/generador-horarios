import api from './axios';

export interface Course {
  id: string;
  name: string;
  _count?: { teacherCourses: number; blockCourses: number };
}

export interface Period {
  id: string;
  name: string;
  startDate: string;
  weeks: number;
  isActive: boolean;
  blocks: Block[];
}

export interface Block {
  id: string;
  periodId: string;
  name: string;
  startWeek: number;
  endWeek: number;
  _count?: { courses: number };
  courses?: { course: Course }[];
  period?: Period;
}

export const academicService = {
  // Courses
  async listCourses(): Promise<Course[]> {
    return (await api.get('/api/academic/courses')).data;
  },
  async createCourse(name: string) {
    return (await api.post('/api/academic/courses', { name })).data;
  },
  async deleteCourse(id: string) {
    return (await api.delete(`/api/academic/courses/${id}`)).data;
  },
  // Periods
  async listPeriods(): Promise<Period[]> {
    return (await api.get('/api/academic/periods')).data;
  },
  async createPeriod(name: string, startDate: string, weeks: number) {
    return (await api.post('/api/academic/periods', { name, startDate, weeks })).data;
  },
  async togglePeriod(id: string, isActive: boolean) {
    return (await api.patch(`/api/academic/periods/${id}`, { isActive })).data;
  },
  async deletePeriod(id: string) {
    return (await api.delete(`/api/academic/periods/${id}`)).data;
  },
  // Blocks
  async listBlocks(periodId?: string): Promise<Block[]> {
    const q = periodId ? `?periodId=${periodId}` : '';
    return (await api.get(`/api/academic/blocks${q}`)).data;
  },
  async createBlock(data: { periodId: string; name: string; startWeek: number; endWeek: number }) {
    return (await api.post('/api/academic/blocks', data)).data;
  },
  async deleteBlock(id: string) {
    return (await api.delete(`/api/academic/blocks/${id}`)).data;
  },
  async addCourseToBlock(blockId: string, courseId: string) {
    return (await api.post(`/api/academic/blocks/${blockId}/courses`, { courseId })).data;
  },
  async removeCourseFromBlock(blockId: string, courseId: string) {
    return (await api.delete(`/api/academic/blocks/${blockId}/courses/${courseId}`)).data;
  },
};