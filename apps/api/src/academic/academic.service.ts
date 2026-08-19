import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicService {
  constructor(private prisma: PrismaService) {}

  // ===== CURSOS =====
  async createCourse(name: string) {
    if (await this.prisma.course.findUnique({ where: { name } })) {
      throw new ConflictException('Curso ya existe');
    }
    return this.prisma.course.create({ data: { name } });
  }

  async listCourses() {
    return this.prisma.course.findMany({
      include: { _count: { select: { teacherCourses: true, blockCourses: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async deleteCourse(id: string) {
    const uses = await this.prisma.teacherCourse.count({ where: { courseId: id } });
    if (uses > 0) throw new ConflictException('El curso está asignado a docentes. Desasígnalo primero.');
    return this.prisma.course.delete({ where: { id } });
  }

  // ===== PERÍODOS =====
  async createPeriod(name: string, startDate: string, weeks: number) {
    if (await this.prisma.period.findUnique({ where: { name } })) {
      throw new ConflictException('Período ya existe');
    }
    const date = new Date(`${startDate}T00:00:00Z`);
    if (date.getUTCDay() !== 1) throw new BadRequestException('La fecha debe ser LUNES');
    return this.prisma.period.create({ data: { name, startDate: date, weeks, isActive: true } });
  }

  async listPeriods() {
    return this.prisma.period.findMany({
      include: { blocks: { include: { _count: { select: { courses: true } } } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async togglePeriod(id: string, isActive: boolean) {
    return this.prisma.period.update({ where: { id }, data: { isActive } });
  }

  async deletePeriod(id: string) {
    const blocks = await this.prisma.block.count({ where: { periodId: id } });
    if (blocks > 0) throw new ConflictException('El período tiene bloques. Elimínalos primero.');
    return this.prisma.period.delete({ where: { id } });
  }

  // ===== BLOQUES =====
  async createBlock(data: { periodId: string; name: string; startWeek: number; endWeek: number }) {
    const period = await this.prisma.period.findUnique({ where: { id: data.periodId } });
    if (!period) throw new NotFoundException('Período no encontrado');
    if (data.startWeek < 1 || data.endWeek > period.weeks || data.startWeek > data.endWeek) {
      throw new BadRequestException(`Rango inválido. El período tiene ${period.weeks} semanas.`);
    }
    return this.prisma.block.create({ data });
  }

  async listBlocks(periodId?: string) {
    return this.prisma.block.findMany({
      where: periodId ? { periodId } : {},
      include: { period: true, courses: { include: { course: true } } },
      orderBy: [{ periodId: 'asc' }, { startWeek: 'asc' }],
    });
  }

  async addCourseToBlock(blockId: string, courseId: string) {
    return this.prisma.blockCourse.upsert({
      where: { blockId_courseId: { blockId, courseId } },
      update: {},
      create: { blockId, courseId },
    });
  }

  async removeCourseFromBlock(blockId: string, courseId: string) {
    return this.prisma.blockCourse.delete({
      where: { blockId_courseId: { blockId, courseId } },
    });
  }

  async deleteBlock(id: string) {
    const sessions = await this.prisma.scheduleSession.count({ where: { blockId: id } });
    if (sessions > 0) throw new ConflictException('El bloque tiene sesiones de horario.');
    return this.prisma.$transaction(async (tx) => {
      await tx.blockCourse.deleteMany({ where: { blockId: id } });
      return tx.block.delete({ where: { id } });
    });
  }
}