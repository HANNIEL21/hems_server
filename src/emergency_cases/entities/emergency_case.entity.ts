import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EmergencyCaseDocument = HydratedDocument<EmergencyCase>;

export type IncidentType =
  | 'medical'
  | 'fire'
  | 'traffic'
  | 'security'
  | 'natural_disaster'
  | 'other'
  | (string & Record<never, never>);

export type EmergencyStatus =
  | 'pending'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'cancelled'
  | (string & Record<never, never>);

export const EMERGENCY_STATUSES: EmergencyStatus[] = [
  'pending',
  'acknowledged',
  'in_progress',
  'resolved',
  'cancelled',
];

@Schema({ _id: false })
export class EmergencyLocation {
  @Prop({ trim: true })
  address?: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;
}

export const EmergencyLocationSchema =
  SchemaFactory.createForClass(EmergencyLocation);

@Schema({ timestamps: true })
export class EmergencyCase {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reported_by: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  incident_type: IncidentType;

  @Prop({ type: String, default: 'pending', index: true })
  status: EmergencyStatus;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: EmergencyLocationSchema })
  location?: EmergencyLocation;

  @Prop({ type: Types.ObjectId, ref: 'Incident', index: true })
  incident?: Types.ObjectId;
}

export const EmergencyCaseSchema = SchemaFactory.createForClass(EmergencyCase);