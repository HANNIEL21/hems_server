import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { FindAllActivityDto } from './dto/find-all-activity.dto';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activityService.record(createActivityDto);
  }

  @Get()
  findAll(@Query() query: FindAllActivityDto) {
    return this.activityService.findAll(query);
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

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.activityService.findByUser(userId);
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
