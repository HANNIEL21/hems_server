import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateIncidentStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}