import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const INCLUDE_FULL = {
  courses: { include: { course: true } },
  turnos: { include: { turno: true } },
  sedes: { include: { sede: true } },
  unavailableDays: true,
};

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async create(data: { firstName: string; lastName: string; dni: string; phone?: string; email?: string; maxSessionsPerWeek?: number }) {
    if (await this.prisma.teacher.findUnique({ where: { dni: data.dni } })) {
      throw new ConflictException('Ya existe un docente con ese DNI');
    }
    return this.prisma.teacher.create({ data, include: INCLUDE_FULL });
  }

  async list(search?: string) {
    return this.prisma.teacher.findMany({
      where: search ? {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { dni: { contains: search } },
        ],
      } : undefined,
      include: INCLUDE_FULL,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findOne(id: string) {
    const t = await this.prisma.teacher.findUnique({ where: { id }, include: INCLUDE_FULL });
    if (!t) throw new NotFoundException('Docente no encontrado');
    return t;
  }

  async updateBasic(id: string, data: { firstName?: string; lastName?: string; dni?: string; phone?: string; email?: string; maxSessionsPerWeek?: number | null }) {
    await this.findOne(id);
    if (data.dni) {
      const exists = await this.prisma.teacher.findFirst({ where: { dni: data.dni, NOT: { id } } });
      if (exists) throw new ConflictException('DNI ya usado');
    }
    return this.prisma.teacher.update({ where: { id }, data, include: INCLUDE_FULL });
  }

  async toggleActive(id: string) {
    const t = await this.findOne(id);
    return this.prisma.teacher.update({ where: { id }, data: { isActive: !t.isActive }, include: INCLUDE_FULL });
  }

  async delete(id: string) {
    const sessions = await this.prisma.scheduleSession.count({ where: { teacherId: id } });
    if (sessions > 0) throw new ConflictException('El docente tiene sesiones de horario. Desasígnalo primero.');
    return this.prisma.teacher.delete({ where: { id } });
  }

  // ===== GESTIÓN DE DISPONIBILIDAD =====

  // Cursos que puede dictar
  async addCourse(teacherId: string, courseId: string) {
    return this.prisma.teacherCourse.upsert({
      where: { teacherId_courseId: { teacherId, courseId } },
      update: {}, create: { teacherId, courseId },
    });
  }

  async removeCourse(teacherId: string, courseId: string) {
    // No permitir si ya tiene sesiones asignadas con ese curso
    const sessions = await this.prisma.scheduleSession.count({
      where: { teacherId, courseId },
    });
    if (sessions > 0) throw new ConflictException('El docente tiene sesiones con este curso.');
    return this.prisma.teacherCourse.delete({
      where: { teacherId_courseId: { teacherId, courseId } },
    });
  }

  // Turnos preferidos (vacío = todos)
  async setTurnos(teacherId: string, turnoIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.teacherTurno.deleteMany({ where: { teacherId } });
      if (turnoIds.length > 0) {
        await tx.teacherTurno.createMany({
          data: turnoIds.map((turnoId) => ({ teacherId, turnoId })),
        });
      }
      return tx.teacher.findUniqueOrThrow({ where: { id: teacherId }, include: INCLUDE_FULL });
    });
  }

  // Sedes preferidas (vacío = todas)
  async setSedes(teacherId: string, sedeIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.teacherSede.deleteMany({ where: { teacherId } });
      if (sedeIds.length > 0) {
        await tx.teacherSede.createMany({
          data: sedeIds.map((sedeId) => ({ teacherId, sedeId })),
        });
      }
      return tx.teacher.findUniqueOrThrow({ where: { id: teacherId }, include: INCLUDE_FULL });
    });
  }

  // Días no disponibles
  async setUnavailableDays(teacherId: string, days: number[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.teacherUnavailableDay.deleteMany({ where: { teacherId } });
      if (days.length > 0) {
        await tx.teacherUnavailableDay.createMany({
          data: days.map((dayOfWeek) => ({ teacherId, dayOfWeek })),
        });
      }
      return tx.teacher.findUniqueOrThrow({ where: { id: teacherId }, include: INCLUDE_FULL });
    });
  }
}