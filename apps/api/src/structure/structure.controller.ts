import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StructureService } from './structure.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@horarios/database';

@ApiTags('Estructura')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('structure')
export class StructureController {
  constructor(private svc: StructureService) {}

  @Post('sedes')
  @Roles(Role.ADMIN)
  createSede(@Body('name') name: string) { return this.svc.createSede(name); }

  @Get('sedes')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  listSedes() { return this.svc.listSedes(); }

  @Delete('sedes/:id')
  @Roles(Role.ADMIN)
  deleteSede(@Param('id') id: string) { return this.svc.deleteSede(id); }

  @Post('turnos')
  @Roles(Role.ADMIN)
  createTurno(@Body() body: { name: string; slot1Start: string; slot1End: string; slot2Start: string; slot2End: string }) {
    return this.svc.createTurno(body);
  }

  @Get('turnos')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  listTurnos() { return this.svc.listTurnos(); }

  @Delete('turnos/:id')
  @Roles(Role.ADMIN)
  deleteTurno(@Param('id') id: string) { return this.svc.deleteTurno(id); }

  @Post('classrooms')
  @Roles(Role.ADMIN)
  createClassroom(@Body() body: { name: string; sedeId: string; turnoIds: string[] }) {
    return this.svc.createClassroom(body.name, body.sedeId, body.turnoIds);
  }

  @Delete('classrooms/:id')
  @Roles(Role.ADMIN)
  deleteClassroom(@Param('id') id: string) { return this.svc.deleteClassroom(id); }
}