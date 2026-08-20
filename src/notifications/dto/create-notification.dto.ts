import {
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export const NOTIFICATION_TYPES = ['report', 'assign', 'resolve', 'info'];

export class CreateNotificationDto {
  @IsMongoId()
  recipient: string;

  @IsIn(NOTIFICATION_TYPES)
  type: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsMongoId()
  caseId?: string;

  @IsOptional()
  @IsMongoId()
  incidentId?: string;

  @IsOptional()
  @IsBoolean()
  read?: boolean;
}
