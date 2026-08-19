import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activityService.record(createActivityDto);
  }

  @Get()
  findAll() {
    return this.activityService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.activityService.getStats();
  }

  @Get('action/:action')
  findByAction(@Param('action') action: string) {
    return this.activityService.findByAction(action);
  }

  @Get('case/:caseId')
  findByCase(@Param('caseId') caseId: string) {
    return this.activityService.findByCase(caseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activityService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activityService.remove(id);
  }
}
