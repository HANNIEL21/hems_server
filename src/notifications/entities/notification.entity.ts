import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export type NotificationType =
  'report' | 'assign' | 'resolve' | 'info' | (string & Record<never, never>);

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipient: Types.ObjectId;

  @Prop({ type: String, required: true })
  type: NotificationType;

  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, trim: true })
  message?: string;

  @Prop({ type: Types.ObjectId, ref: 'EmergencyCase' })
  caseId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Incident' })
  incidentId?: Types.ObjectId;

  @Prop({ default: false, index: true })
  read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
