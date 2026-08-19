import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignEmergencyCaseDto {
  @IsString()
  @IsNotEmpty()
  assigned_staff: string;

  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high', 'critical'])
  severity_level?: string;
}
