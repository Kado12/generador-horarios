import { Controller, Get, Post, Param, Res, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ImportsService } from './imports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@horarios/database';

@ApiTags('Importaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('imports')
export class ImportsController {
  constructor(private svc: ImportsService) {}

  @Get('template/:type')
  @Roles(Role.ADMIN)
  async template(@Param('type') type: string, @Res() res: Response) {
    const buffer = await this.svc.generateTemplate(type);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="plantilla-${type}.xlsx"`,
    });
    res.send(buffer);
  }

  @Post(':type')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async importFile(@Param('type') type: string, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Debes subir un archivo');
    if (type === 'teachers') return this.svc.importTeachers(file.buffer);
    if (type === 'sections') return this.svc.importSections(file.buffer);
    throw new BadRequestException('Tipo no válido');
  }
}