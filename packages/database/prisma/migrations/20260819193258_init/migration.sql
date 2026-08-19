-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'COORDINADOR') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sedes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `sedes_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `turnos` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slot1Start` VARCHAR(191) NOT NULL,
    `slot1End` VARCHAR(191) NOT NULL,
    `slot2Start` VARCHAR(191) NOT NULL,
    `slot2End` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `turnos_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classrooms` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sedeId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `classrooms_name_sedeId_key`(`name`, `sedeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sections` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `classroomId` VARCHAR(191) NOT NULL,
    `turnoId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `sections_classroomId_turnoId_key`(`classroomId`, `turnoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `courses_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `periods` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `weeks` INTEGER NOT NULL DEFAULT 12,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `periods_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blocks` (
    `id` VARCHAR(191) NOT NULL,
    `periodId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startWeek` INTEGER NOT NULL,
    `endWeek` INTEGER NOT NULL,

    UNIQUE INDEX `blocks_periodId_name_key`(`periodId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `block_courses` (
    `id` VARCHAR(191) NOT NULL,
    `blockId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `block_courses_blockId_courseId_key`(`blockId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teachers` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `dni` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `maxSessionsPerWeek` INTEGER NULL,

    UNIQUE INDEX `teachers_dni_key`(`dni`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_courses` (
    `teacherId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `teacher_courses_teacherId_courseId_key`(`teacherId`, `courseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_turnos` (
    `teacherId` VARCHAR(191) NOT NULL,
    `turnoId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `teacher_turnos_teacherId_turnoId_key`(`teacherId`, `turnoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_sedes` (
    `teacherId` VARCHAR(191) NOT NULL,
    `sedeId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `teacher_sedes_teacherId_sedeId_key`(`teacherId`, `sedeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_unavailable_days` (
    `teacherId` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,

    UNIQUE INDEX `teacher_unavailable_days_teacherId_dayOfWeek_key`(`teacherId`, `dayOfWeek`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schedule_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `blockId` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `slot` INTEGER NOT NULL,

    UNIQUE INDEX `schedule_sessions_sectionId_dayOfWeek_slot_key`(`sectionId`, `dayOfWeek`, `slot`),
    UNIQUE INDEX `schedule_sessions_teacherId_dayOfWeek_slot_key`(`teacherId`, `dayOfWeek`, `slot`),
    UNIQUE INDEX `schedule_sessions_sectionId_courseId_key`(`sectionId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `classrooms` ADD CONSTRAINT `classrooms_sedeId_fkey` FOREIGN KEY (`sedeId`) REFERENCES `sedes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `classrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `turnos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blocks` ADD CONSTRAINT `blocks_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `periods`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `block_courses` ADD CONSTRAINT `block_courses_blockId_fkey` FOREIGN KEY (`blockId`) REFERENCES `blocks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `block_courses` ADD CONSTRAINT `block_courses_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_courses` ADD CONSTRAINT `teacher_courses_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_courses` ADD CONSTRAINT `teacher_courses_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_turnos` ADD CONSTRAINT `teacher_turnos_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_turnos` ADD CONSTRAINT `teacher_turnos_turnoId_fkey` FOREIGN KEY (`turnoId`) REFERENCES `turnos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_sedes` ADD CONSTRAINT `teacher_sedes_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_sedes` ADD CONSTRAINT `teacher_sedes_sedeId_fkey` FOREIGN KEY (`sedeId`) REFERENCES `sedes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_unavailable_days` ADD CONSTRAINT `teacher_unavailable_days_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_sessions` ADD CONSTRAINT `schedule_sessions_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_sessions` ADD CONSTRAINT `schedule_sessions_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_sessions` ADD CONSTRAINT `schedule_sessions_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_sessions` ADD CONSTRAINT `schedule_sessions_blockId_fkey` FOREIGN KEY (`blockId`) REFERENCES `blocks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
