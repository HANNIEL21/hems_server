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
import { EmergencyCasesService } from './emergency_cases.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateEmergencyCaseDto } from './dto/create-emergency_case.dto';
import { UpdateEmergencyCaseDto } from './dto/update-emergency_case.dto';
import { FindAllEmergencyCasesDto } from './dto/find-all-emergency-cases.dto';

@Controller('emergency-cases')
export class EmergencyCasesController {
  constructor(private readonly emergencyCasesService: EmergencyCasesService) {}

  @Post()
  create(
    @Body() dto: CreateEmergencyCaseDto,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.emergencyCasesService.create(dto, actorId);
  }

  @Get()
  findAll(@Query() query: FindAllEmergencyCasesDto) {
    return this.emergencyCasesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emergencyCasesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmergencyCaseDto,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.emergencyCasesService.update(id, dto, actorId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('userId') actorId: string) {
    return this.emergencyCasesService.remove(id, actorId);
  }
}
