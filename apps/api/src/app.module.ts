import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StructureModule } from './structure/structure.module';
import { AcademicModule } from './academic/academic.module';
import { TeachersModule } from './teachers/teachers.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    StructureModule,
    AcademicModule,
    TeachersModule,
    SchedulerModule,
  ],
})
export class AppModule {}