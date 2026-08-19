import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { EMERGENCY_STATUSES } from '../entities/emergency_case.entity';
import type { EmergencyStatus } from '../entities/emergency_case.entity';

export class FindAllEmergencyCasesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @IsIn(EMERGENCY_STATUSES)
  status?: EmergencyStatus;

  @IsOptional()
  @IsString()
  incident_type?: string;

  @IsOptional()
  @IsString()
  reported_by?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}