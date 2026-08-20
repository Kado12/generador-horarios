import { Controller, Post, Get, Delete, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@horarios/database';
import { Response } from 'express';

@ApiTags('Generador')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduler')
export class SchedulerController {
  constructor(private svc: SchedulerService) {}

  @Post('generate/:blockId')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  generate(@Param('blockId') blockId: string) {
    return this.svc.generate(blockId);
  }

  @Get('result/:blockId')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  getResult(@Param('blockId') blockId: string) {
    return this.svc.getResult(blockId);
  }

  @Delete('clear/:blockId')
  @Roles(Role.ADMIN)
  clear(@Param('blockId') blockId: string) {
    return this.svc.clear(blockId);
  }

    @Get('export/:blockId')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  async exportExcel(@Param('blockId') blockId: string, @Res() res: Response) {
    const buffer = await this.svc.exportExcel(blockId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="horario_${blockId}.xlsx"`,
    });
    res.send(buffer);
  }
}