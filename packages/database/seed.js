const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed...');

  // Usuarios
  for (const u of [
    { email: 'admin@horarios.edu', password: 'Admin2026!', firstName: 'Admin', lastName: 'Horarios', role: 'ADMIN' },
    { email: 'coord@horarios.edu', password: 'Coord2026!', firstName: 'Coordinador', lastName: 'Horarios', role: 'COORDINADOR' },
  ]) {
    const { password, ...userData } = u;
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { 
        ...userData,
        passwordHash: await bcrypt.hash(password, 10) 
      },
    });
  }

  // Sedes
  const sede = await prisma.sede.upsert({
    where: { name: 'Sede Central' }, update: {}, create: { name: 'Sede Central' },
  });

  // Turnos (slots fijos de 3h)
  const manana = await prisma.turno.upsert({
    where: { name: 'Mañana' }, update: {},
    create: { name: 'Mañana', slot1Start: '08:00', slot1End: '11:00', slot2Start: '11:00', slot2End: '14:00' },
  });
  const noche = await prisma.turno.upsert({
    where: { name: 'Noche' }, update: {},
    create: { name: 'Noche', slot1Start: '18:00', slot1End: '21:00', slot2Start: '21:00', slot2End: '22:00' },
  });

  // Salones físicos + secciones (salón + turno)
  const salonNames = ['A11', 'A12', 'A13', 'A14'];
  for (const name of salonNames) {
    const classroom = await prisma.classroom.upsert({
      where: { name_sedeId: { name, sedeId: sede.id } },
      update: {}, create: { name, sedeId: sede.id },
    });
    for (const [turno, suffix] of [[manana, 'M'], [noche, 'N']]) {
      await prisma.section.upsert({
        where: { classroomId_turnoId: { classroomId: classroom.id, turnoId: turno.id } },
        update: {}, create: { name: `${name} - ${suffix}`, classroomId: classroom.id, turnoId: turno.id },
      });
    }
  }

  // 10 cursos del bloque
  const courseNames = ['Aritmética', 'Álgebra', 'Geometría', 'Trigonometría', 'Física', 'Química', 'Lenguaje', 'Literatura', 'Historia', 'Cívica'];
  const courses = [];
  for (const name of courseNames) {
    courses.push(await prisma.course.upsert({ where: { name }, update: {}, create: { name } }));
  }

  // Período + bloque + cursos del bloque
  const period = await prisma.period.upsert({
    where: { name: '2026' }, update: {},
    create: { name: '2026', startDate: new Date('2026-03-02'), weeks: 12, isActive: true },
  });
  const block = await prisma.block.upsert({
    where: { periodId_name: { periodId: period.id, name: 'Bloque 1' } },
    update: {}, create: { periodId: period.id, name: 'Bloque 1', startWeek: 1, endWeek: 6 },
  });
  for (const c of courses) {
    await prisma.blockCourse.upsert({
      where: { blockId_courseId: { blockId: block.id, courseId: c.id } },
      update: {}, create: { blockId: block.id, courseId: c.id },
    });
  }

  // 8 docentes: cada uno puede dar varios cursos
  const teacherData = [
    { firstName: 'Juan', lastName: 'Pérez', dni: '11111111', courses: [0, 1] },
    { firstName: 'María', lastName: 'Gómez', dni: '22222222', courses: [1, 2] },
    { firstName: 'Luis', lastName: 'Díaz', dni: '33333333', courses: [3, 4] },
    { firstName: 'Ana', lastName: 'Torres', dni: '44444444', courses: [4, 5] },
    { firstName: 'Pedro', lastName: 'Ruiz', dni: '55555555', courses: [6, 7] },
    { firstName: 'Lucía', lastName: 'Vega', dni: '66666666', courses: [7, 8] },
    { firstName: 'Jorge', lastName: 'Castro', dni: '77777777', courses: [8, 9] },
    { firstName: 'Rosa', lastName: 'Mendoza', dni: '88888888', courses: [9, 0, 2] },
  ];
  for (const t of teacherData) {
    const teacher = await prisma.teacher.upsert({
      where: { dni: t.dni }, update: {},
      create: { firstName: t.firstName, lastName: t.lastName, dni: t.dni, maxSessionsPerWeek: 15 },
    });
    for (const ci of t.courses) {
      await prisma.teacherCourse.upsert({
        where: { teacherId_courseId: { teacherId: teacher.id, courseId: courses[ci].id } },
        update: {}, create: { teacherId: teacher.id, courseId: courses[ci].id },
      });
    }
  }

  // Ejemplo de restricciones: Juan no trabaja sábados... (días 1-5); María solo Mañana; Luis solo Sede Central
  const juan = await prisma.teacher.findUnique({ where: { dni: '11111111' } });
  await prisma.teacherUnavailableDay.upsert({
    where: { teacherId_dayOfWeek: { teacherId: juan.id, dayOfWeek: 5 } },
    update: {}, create: { teacherId: juan.id, dayOfWeek: 5 },
  });
  const maria = await prisma.teacher.findUnique({ where: { dni: '22222222' } });
  await prisma.teacherTurno.upsert({
    where: { teacherId_turnoId: { teacherId: maria.id, turnoId: manana.id } },
    update: {}, create: { teacherId: maria.id, turnoId: manana.id },
  });

  console.log('🎉 Seed completado');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());