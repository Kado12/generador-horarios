import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class StructureService {
  constructor(private prisma: PrismaService) {}

  // ===== SEDES =====
  async createSede(name: string) {
    if (await this.prisma.sede.findUnique({ where: { name } })) {
      throw new ConflictException('Sede ya existe');
    }
    return this.prisma.sede.create({ data: { name } });
  }

  async listSedes() {
    return this.prisma.sede.findMany({
      include: { classrooms: { include: { sections: { include: { turno: true } } } } },
      orderBy: { name: 'asc' },
    });
  }

  async deleteSede(id: string) {
    const sede = await this.prisma.sede.findUnique({ where: { id }, include: { classrooms: true } });
    if (!sede) throw new NotFoundException('Sede no encontrada');
    if (sede.classrooms.length > 0) {
      throw new ConflictException('La sede tiene salones. Elimínalos primero.');
    }
    return this.prisma.sede.delete({ where: { id } });
  }

  // ===== TURNOS =====
  async createTurno(data: { name: string; slot1Start: string; slot1End: string; slot2Start: string; slot2End: string }) {
    if (await this.prisma.turno.findUnique({ where: { name: data.name } })) {
      throw new ConflictException('Turno ya existe');
    }
    return this.prisma.turno.create({ data });
  }

  async listTurnos() {
    return this.prisma.turno.findMany({ orderBy: { name: 'asc' } });
  }

  async deleteTurno(id: string) {
    const t = await this.prisma.turno.findUnique({ where: { id }, include: { sections: true } });
    if (!t) throw new NotFoundException('Turno no encontrado');
    if (t.sections.length > 0) {
      throw new ConflictException('El turno tiene secciones. Elimínalas primero.');
    }
    return this.prisma.turno.delete({ where: { id } });
  }

  // ===== SALONES =====
  // Al crear un salón, automáticamente crea una SECCIÓN por cada turno (ej: A11 - M, A11 - N)
  async createClassroom(name: string, sedeId: string, turnoIds: string[]) {
    const sede = await this.prisma.sede.findUnique({ where: { id: sedeId } });
    if (!sede) throw new NotFoundException('Sede no encontrada');

    if (await this.prisma.classroom.findFirst({ where: { name, sedeId } })) {
      throw new ConflictException('Ya existe un salón con ese nombre en la sede');
    }

    if (turnoIds.length === 0) {
      throw new ConflictException('Selecciona al menos un turno para el salón');
    }

    return this.prisma.$transaction(async (tx) => {
      const classroom = await tx.classroom.create({ data: { name, sedeId } });

      for (const turnoId of turnoIds) {
        const turno = await tx.turno.findUnique({ where: { id: turnoId } });
        if (!turno) continue;
        await tx.section.create({
          data: {
            name: `${name} - ${turno.name.charAt(0)}`,
            classroomId: classroom.id,
            turnoId,
          },
        });
      }

      return tx.classroom.findUniqueOrThrow({
        where: { id: classroom.id },
        include: { sections: { include: { turno: true } } },
      });
    });
  }

  async deleteClassroom(id: string) {
    const c = await this.prisma.classroom.findUnique({ where: { id }, include: { sections: true } });
    if (!c) throw new NotFoundException('Salón no encontrado');

    // Verificar que las secciones no tengan sesiones de horario
    const sessions = await this.prisma.scheduleSession.count({
      where: { section: { classroomId: id } },
    });
    if (sessions > 0) {
      throw new ConflictException('El salón tiene sesiones de horario. Libéralo primero.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.section.deleteMany({ where: { classroomId: id } });
      return tx.classroom.delete({ where: { id } });
    });
  }

    // ===== SECCIONES =====
  async listSections() {
    return this.prisma.section.findMany({
      include: {
        classroom: { include: { sede: true } },
        turno: true,
        _count: { select: { sessions: true } },
      },
      orderBy: [
        { classroom: { sede: { name: 'asc' } } },
        { name: 'asc' },
      ],
    });
  }

  async createSection(data: { name?: string; classroomId: string; turnoId: string }) {
    const exists = await this.prisma.section.findFirst({
      where: { classroomId: data.classroomId, turnoId: data.turnoId },
    });
    if (exists) {
      throw new ConflictException('Ya existe una sección para ese salón y turno');
    }

    const [classroom, turno] = await Promise.all([
      this.prisma.classroom.findUnique({ where: { id: data.classroomId } }),
      this.prisma.turno.findUnique({ where: { id: data.turnoId } }),
    ]);
    if (!classroom || !turno) throw new NotFoundException('Salón o turno no encontrado');

    const name = data.name || `${classroom.name} - ${turno.name.charAt(0)}`;
    return this.prisma.section.create({
      data: { name, classroomId: data.classroomId, turnoId: data.turnoId },
      include: { classroom: { include: { sede: true } }, turno: true },
    });
  }

  async deleteSection(id: string) {
    const count = await this.prisma.scheduleSession.count({ where: { sectionId: id } });
    if (count > 0) {
      throw new ConflictException('La sección tiene sesiones de horario. Limpia el bloque primero.');
    }
    return this.prisma.section.delete({ where: { id } });
  }
}