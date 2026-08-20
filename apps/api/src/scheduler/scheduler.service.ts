import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

interface TeacherInfo {
  id: string;
  maxSessionsPerWeek: number | null;
  courses: Set<string>;   // IDs de cursos que puede dictar
  turnos: Set<string>;    // IDs de turnos preferidos (vacía = todos)
  sedes: Set<string>;     // IDs de sedes preferidas (vacía = todas)
  unavailableDays: Set<number>; // días que NO trabaja (1-5)
}

interface CandidatePair {
  courseId: string;
  teacherId: string;
}

interface Assignment {
  sectionId: string;
  dayOfWeek: number;
  slot: number;
  courseId: string;
  teacherId: string;
}

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

const MAX_RESTARTS = 8; // reintentos aleatorios por sección

@Injectable()
export class SchedulerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Genera el horario completo para un bloque.
   * Reemplaza cualquier horario previo del mismo bloque.
   */
  async generate(blockId: string): Promise<GenerateResult> {
    // 1. Cargar bloque con cursos
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      include: { courses: { include: { course: true } } },
    });
    if (!block) throw new NotFoundException('Bloque no encontrado');

    const courseIds = block.courses.map((bc) => bc.courseId);
    if (courseIds.length === 0) {
      throw new BadRequestException('El bloque no tiene cursos asignados');
    }

    // 2. Cargar todas las secciones
    const sections = await this.prisma.section.findMany({
      include: { classroom: { include: { sede: true } }, turno: true },
    });
    if (sections.length === 0) {
      throw new BadRequestException('No hay secciones creadas');
    }

    // 3. Cargar docentes con disponibilidad
    const teachersRaw = await this.prisma.teacher.findMany({
      where: { isActive: true },
      include: {
        courses: true,
        turnos: true,
        sedes: true,
        unavailableDays: true,
      },
    });

    const teachers = new Map<string, TeacherInfo>();
    for (const t of teachersRaw) {
      teachers.set(t.id, {
        id: t.id,
        maxSessionsPerWeek: t.maxSessionsPerWeek,
        courses: new Set(t.courses.map((c) => c.courseId)),
        turnos: new Set(t.turnos.map((tt) => tt.turnoId)),
        sedes: new Set(t.sedes.map((s) => s.sedeId)),
        unavailableDays: new Set(t.unavailableDays.map((d) => d.dayOfWeek)),
      });
    }

    // 4. Limpiar sesiones previas del bloque (regeneración)
    await this.prisma.scheduleSession.deleteMany({ where: { blockId } });

    // 5. Resolver cada sección
    const allAssignments: Assignment[] = [];
    const unresolved: { sectionId: string; sectionName: string; reason: string }[] = [];
    const teachersUsedSet = new Set<string>();

    const globalTeacherOccupation = new Set<string>();

    for (const section of sections) {
      const result = this.solveSection(section, courseIds, teachers, globalTeacherOccupation);
      if (result.ok) {
        for (const a of result.assignments) {
          allAssignments.push(a);
          teachersUsedSet.add(a.teacherId);
          // Registrar ocupación global
          globalTeacherOccupation.add(`${a.teacherId}::${a.dayOfWeek}::${a.slot}`);
        }
      } else {
        unresolved.push({
          sectionId: section.id,
          sectionName: section.name,
          reason: result.reason || 'No se pudo encontrar asignación válida',
        });
      }
    }

    // 6. Validar carga semanal global por docente (maxSessionsPerWeek)
    const teacherWeeklyCount = new Map<string, number>();
    for (const a of allAssignments) {
      teacherWeeklyCount.set(a.teacherId, (teacherWeeklyCount.get(a.teacherId) || 0) + 1);
    }

    // Si algún docente excede su máximo, re-marcamos las sesiones afectadas como "no resueltas"
    const excessTeachers = new Set<string>();
    for (const [tid, count] of teacherWeeklyCount.entries()) {
      const info = teachers.get(tid);
      if (info?.maxSessionsPerWeek && count > info.maxSessionsPerWeek) {
        excessTeachers.add(tid);
      }
    }

    // Filtrar sesiones que usan docentes excedidos y moverlas a "no resueltas"
    const validAssignments: Assignment[] = [];
    const assignmentsToRemove = new Set<string>(); // sectionId+day+slot
    for (const a of allAssignments) {
      if (excessTeachers.has(a.teacherId)) {
        assignmentsToRemove.add(`${a.sectionId}::${a.dayOfWeek}::${a.slot}`);
      } else {
        validAssignments.push(a);
      }
    }

    // Las secciones que perdieron alguna asignación pasan a unresolved
    const removedSections = new Set<string>();
    for (const key of assignmentsToRemove) {
      const [sectionId] = key.split('::');
      removedSections.add(sectionId);
    }
    for (const sectionId of removedSections) {
      const section = sections.find((s) => s.id === sectionId);
      if (section && !unresolved.find((u) => u.sectionId === sectionId)) {
        unresolved.push({
          sectionId,
          sectionName: section.name,
          reason: 'Docente asignado excedió su carga semanal máxima. Requiere ajuste manual.',
        });
      }
    }
    const finalAssignments = validAssignments.filter(
      (a) => !assignmentsToRemove.has(`${a.sectionId}::${a.dayOfWeek}::${a.slot}`),
    );

    // 7. Insertar en BD en transacción
    if (finalAssignments.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const a of finalAssignments) {
          await tx.scheduleSession.create({
            data: {
              sectionId: a.sectionId,
              courseId: a.courseId,
              teacherId: a.teacherId,
              blockId,
              dayOfWeek: a.dayOfWeek,
              slot: a.slot,
            },
          });
        }
      });
    }

    const resolved = sections.length - unresolved.length;

    return {
      blockId,
      blockName: block.name,
      totalSections: sections.length,
      resolved,
      unresolved,
      totalSessions: finalAssignments.length,
      teachersUsed: Array.from(new Set(finalAssignments.map((a) => a.teacherId))),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Resuelve la asignación para una sección individual.
   * Usa backtracking con MRV (slots más restringidos primero).
   */
  private solveSection(
    section: { id: string; turnoId: string; classroom: { sedeId: string } },
    courseIds: string[],
    teachers: Map<string, TeacherInfo>,
    globalTeacherOccupation: Set<string>,
  ): { ok: boolean; assignments: Assignment[]; reason?: string } {
    const slots: { dayOfWeek: number; slot: number }[] = [];
    for (let d = 1; d <= 5; d++) {
      for (let s = 1; s <= 2; s++) slots.push({ dayOfWeek: d, slot: s });
    }

    // Si hay menos cursos que slots, truncar (cursos repetidos no permitidos por constraint)
    const numCourses = courseIds.length;
    if (numCourses > slots.length) {
      return { ok: false, assignments: [], reason: `Más cursos (${numCourses}) que slots (${slots.length})` };
    }

    // Construir matriz de opciones por slot
    const optionsBySlot = new Map<string, CandidatePair[]>();
    for (const slot of slots) {
      const key = `${slot.dayOfWeek}-${slot.slot}`;
      const candidates: CandidatePair[] = [];

      for (const courseId of courseIds) {
        // Docentes válidos para este curso + slot + sección
        for (const [, t] of teachers) {
          if (!t.courses.has(courseId)) continue;
          if (t.unavailableDays.has(slot.dayOfWeek)) continue;
          if (t.turnos.size > 0 && !t.turnos.has(section.turnoId)) continue;
          if (t.sedes.size > 0 && !t.sedes.has(section.classroom.sedeId)) continue;
          candidates.push({ courseId, teacherId: t.id });
        }
      }

      optionsBySlot.set(key, candidates);
    }

    // MRV: ordenar slots por cantidad de opciones (ascendente)
    const orderedSlots = [...slots].sort((a, b) => {
      const ka = `${a.dayOfWeek}-${a.slot}`;
      const kb = `${b.dayOfWeek}-${b.slot}`;
      return (optionsBySlot.get(ka)?.length || 0) - (optionsBySlot.get(kb)?.length || 0);
    });

    // Intentar resolver con restarts aleatorios
    for (let attempt = 0; attempt < MAX_RESTARTS; attempt++) {
      const assignment = this.backtrack(orderedSlots, optionsBySlot, section.id, globalTeacherOccupation);
      if (assignment) {
        return { ok: true, assignments: assignment };
      }
      // Shuffle
      for (let i = orderedSlots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedSlots[i], orderedSlots[j]] = [orderedSlots[j], orderedSlots[i]];
      }
    }

    return { ok: false, assignments: [], reason: `Sin docentes suficientes tras ${MAX_RESTARTS} intentos` };
  }

  /**
   * Backtracking: asigna un curso + docente a cada slot sin repetir cursos
   * y sin que el mismo docente tenga dos clases en el mismo (day, slot).
   */
  private backtrack(
    slots: { dayOfWeek: number; slot: number }[],
    optionsBySlot: Map<string, CandidatePair[]>,
    sectionId: string,
    globalTeacherOccupation: Set<string>, // ← NUEVO
  ): Assignment[] | null {
    const usedCourses = new Set<string>();
    const assignments: Assignment[] = [];

    const solve = (idx: number): boolean => {
      if (idx === slots.length) return true;

      const s = slots[idx];
      const key = `${s.dayOfWeek}-${s.slot}`;
      const options = optionsBySlot.get(key) || [];

      // Shuffle opciones
      const shuffled = [...options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      for (const opt of shuffled) {
        if (usedCourses.has(opt.courseId)) continue;

        // ✅ VERIFICAR ocupación GLOBAL (no solo local)
        const globalKey = `${opt.teacherId}::${s.dayOfWeek}::${s.slot}`;
        if (globalTeacherOccupation.has(globalKey)) continue;

        // Probar
        usedCourses.add(opt.courseId);
        globalTeacherOccupation.add(globalKey); // marcar temporalmente
        assignments.push({
          sectionId,
          dayOfWeek: s.dayOfWeek,
          slot: s.slot,
          courseId: opt.courseId,
          teacherId: opt.teacherId,
        });

        if (solve(idx + 1)) return true;

        // Backtrack
        assignments.pop();
        usedCourses.delete(opt.courseId);
        globalTeacherOccupation.delete(globalKey); // ← deshacer
      }

      return false;
    };

    return solve(0) ? assignments : null;
  }

  /**
   * Lista las sesiones de un bloque con toda la info relacionada
   */
  async getResult(blockId: string) {
    const sessions = await this.prisma.scheduleSession.findMany({
      where: { blockId },
      include: {
        section: { include: { classroom: { include: { sede: true } }, turno: true } },
        course: true,
        teacher: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { slot: 'asc' }, { section: { name: 'asc' } }],
    });
    return sessions;
  }

  /**
   * Limpia el horario de un bloque
   */
  async clear(blockId: string) {
    const result = await this.prisma.scheduleSession.deleteMany({ where: { blockId } });
    return { deleted: result.count };
  }

    /**
   * Exporta el horario de un bloque a Excel (2 hojas: por sección y por docente)
   */
  async exportExcel(blockId: string): Promise<Buffer> {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      include: { period: true },
    });
    if (!block) throw new NotFoundException('Bloque no encontrado');

    const sessions = await this.getResult(blockId);
    if (sessions.length === 0) {
      throw new BadRequestException('Este bloque aún no tiene horario generado');
    }

    const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Generador de Horarios';

    // ===== HOJA 1: POR SECCIÓN =====
    const ws1 = wb.addWorksheet('HORARIO_SECCIONES');
    ws1.columns = [
      { header: 'Sede', key: 'sede', width: 18 },
      { header: 'Sección', key: 'section', width: 14 },
      { header: 'Turno', key: 'turno', width: 12 },
      { header: 'Día', key: 'dia', width: 12 },
      { header: 'Slot', key: 'slot', width: 8 },
      { header: 'Curso', key: 'curso', width: 22 },
      { header: 'Docente', key: 'docente', width: 28 },
      { header: 'DNI', key: 'dni', width: 12 },
    ];
    ws1.getRow(1).font = { bold: true };
    ws1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    ws1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    for (const s of sessions) {
      ws1.addRow({
        sede: s.section.classroom.sede.name,
        section: s.section.name,
        turno: s.section.turno.name,
        dia: DAY_NAMES[s.dayOfWeek],
        slot: s.slot,
        curso: s.course.name,
        docente: `${s.teacher.lastName}, ${s.teacher.firstName}`,
        dni: s.teacher.dni,
      });
    }

    // ===== HOJA 2: POR DOCENTE =====
    const ws2 = wb.addWorksheet('HORARIO_DOCENTES');
    ws2.columns = [
      { header: 'Docente', key: 'docente', width: 28 },
      { header: 'DNI', key: 'dni', width: 12 },
      { header: 'Día', key: 'dia', width: 12 },
      { header: 'Slot', key: 'slot', width: 8 },
      { header: 'Curso', key: 'curso', width: 22 },
      { header: 'Sección', key: 'section', width: 14 },
      { header: 'Sede', key: 'sede', width: 18 },
    ];
    ws2.getRow(1).font = { bold: true };
    ws2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
    ws2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const byTeacher = [...sessions].sort((a, b) =>
      a.teacher.lastName.localeCompare(b.teacher.lastName) || a.dayOfWeek - b.dayOfWeek || a.slot - b.slot,
    );
    for (const s of byTeacher) {
      ws2.addRow({
        docente: `${s.teacher.lastName}, ${s.teacher.firstName}`,
        dni: s.teacher.dni,
        dia: DAY_NAMES[s.dayOfWeek],
        slot: s.slot,
        curso: s.course.name,
        section: s.section.name,
        sede: s.section.classroom.sede.name,
      });
    }

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}