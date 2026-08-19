import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type IncidentDocument = HydratedDocument<Incident>;

export type IncidentSeverity =
  'low' | 'medium' | 'high' | 'critical' | (string & Record<never, never>);

@Schema({ timestamps: true })
export class Incident {
  @Prop({
    type: Types.ObjectId,
    ref: 'EmergencyCase',
    required: true,
    index: true,
  })
  case_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  assigned_by?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  assigned_staff?: Types.ObjectId;

  @Prop({ type: String, default: 'medium', index: true })
  severity_level: IncidentSeverity;

  @Prop({ trim: true })
  resolution_note?: string;

  @Prop()
  resolved_at?: Date;
}

export const IncidentSchema = SchemaFactory.createForClass(Incident);
