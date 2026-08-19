import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { ResolveIncidentDto } from './dto/resolve-incident.dto';
import { FindAllIncidentsDto } from './dto/find-all-incidents.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  create(
    @Body() createIncidentDto: CreateIncidentDto,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.incidentsService.create(createIncidentDto, actorId);
  }

  @Get()
  findAll(@Query() query: FindAllIncidentsDto) {
    return this.incidentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIncidentDto: UpdateIncidentDto,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.incidentsService.update(id, updateIncidentDto, actorId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentStatusDto,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.incidentsService.updateStatus(id, dto.status, actorId);
  }

  @Patch(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveIncidentDto,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.incidentsService.resolve(id, dto.resolution_note, actorId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('userId') actorId: string) {
    return this.incidentsService.remove(id, actorId);
  }
}