import { IsDateString, IsOptional } from 'class-validator';

export class DashboardStatsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
