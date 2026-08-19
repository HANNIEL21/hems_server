import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DashboardStatsQueryDto } from './dto/dashboard-stats-query.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Query() query: DashboardStatsQueryDto,
  ) {
    return this.dashboardService.getStats(userId, role, query);
  }
}