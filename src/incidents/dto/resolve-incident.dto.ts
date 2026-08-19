import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveIncidentDto {
  @IsString()
  @IsNotEmpty()
  resolution_note: string;
}