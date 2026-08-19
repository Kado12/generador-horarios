import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@horarios/database';

@ApiTags('Docentes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private svc: TeachersService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() body: any) { return this.svc.create(body); }

  @Get()
  @Roles(Role.ADMIN, Role.COORDINADOR)
  list(@Query('search') search?: string) { return this.svc.list(search); }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() body: any) { return this.svc.updateBasic(id, body); }

  @Patch(':id/toggle')
  @Roles(Role.ADMIN)
  toggle(@Param('id') id: string) { return this.svc.toggleActive(id); }

  @Delete(':id')
  @Roles(Role.ADMIN)
  delete(@Param('id') id: string) { return this.svc.delete(id); }

  // Disponibilidad
  @Post(':id/courses/:courseId')
  @Roles(Role.ADMIN)
  addCourse(@Param('id') id: string, @Param('courseId') courseId: string) {
    return this.svc.addCourse(id, courseId);
  }

  @Delete(':id/courses/:courseId')
  @Roles(Role.ADMIN)
  removeCourse(@Param('id') id: string, @Param('courseId') courseId: string) {
    return this.svc.removeCourse(id, courseId);
  }

  @Put(':id/turnos')
  @Roles(Role.ADMIN)
  setTurnos(@Param('id') id: string, @Body('turnoIds') turnoIds: string[]) {
    return this.svc.setTurnos(id, turnoIds || []);
  }

  @Put(':id/sedes')
  @Roles(Role.ADMIN)
  setSedes(@Param('id') id: string, @Body('sedeIds') sedeIds: string[]) {
    return this.svc.setSedes(id, sedeIds || []);
  }

  @Put(':id/unavailable-days')
  @Roles(Role.ADMIN)
  setUnavailable(@Param('id') id: string, @Body('days') days: number[]) {
    return this.svc.setUnavailableDays(id, days || []);
  }
}