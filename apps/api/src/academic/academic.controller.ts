import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicService } from './academic.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@horarios/database';

@ApiTags('Académico')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic')
export class AcademicController {
  constructor(private svc: AcademicService) {}

  @Post('courses')
  @Roles(Role.ADMIN)
  createCourse(@Body('name') name: string) { return this.svc.createCourse(name); }

  @Get('courses')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  listCourses() { return this.svc.listCourses(); }

  @Delete('courses/:id')
  @Roles(Role.ADMIN)
  deleteCourse(@Param('id') id: string) { return this.svc.deleteCourse(id); }

  @Post('periods')
  @Roles(Role.ADMIN)
  createPeriod(@Body() body: { name: string; startDate: string; weeks?: number }) {
    return this.svc.createPeriod(body.name, body.startDate, body.weeks || 12);
  }

  @Get('periods')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  listPeriods() { return this.svc.listPeriods(); }

  @Patch('periods/:id')
  @Roles(Role.ADMIN)
  togglePeriod(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.svc.togglePeriod(id, isActive);
  }

  @Delete('periods/:id')
  @Roles(Role.ADMIN)
  deletePeriod(@Param('id') id: string) { return this.svc.deletePeriod(id); }

  @Post('blocks')
  @Roles(Role.ADMIN)
  createBlock(@Body() body: { periodId: string; name: string; startWeek: number; endWeek: number }) {
    return this.svc.createBlock(body);
  }

  @Get('blocks')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  listBlocks(@Query('periodId') periodId?: string) {
    return this.svc.listBlocks(periodId);
  }

  @Post('blocks/:id/courses')
  @Roles(Role.ADMIN)
  addCourse(@Param('id') id: string, @Body('courseId') courseId: string) {
    return this.svc.addCourseToBlock(id, courseId);
  }

  @Delete('blocks/:id/courses/:courseId')
  @Roles(Role.ADMIN)
  removeCourse(@Param('id') id: string, @Param('courseId') courseId: string) {
    return this.svc.removeCourseFromBlock(id, courseId);
  }

  @Delete('blocks/:id')
  @Roles(Role.ADMIN)
  deleteBlock(@Param('id') id: string) { return this.svc.deleteBlock(id); }
}