import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ActivityDocument = HydratedDocument<Activity>;

export type ActivityAction =
  | 'register'
  | 'login'
  | 'logout'
  | 'refresh_token'
  | 'forgot_password'
  | 'reset_password'
  | 'create'
  | 'update'
  | 'delete'
  | 'read'
  | (string & Record<never, never>);

@Schema({ timestamps: true })
export class Activity {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  user?: Types.ObjectId;

  @Prop({ type: String, required: true })
  action: ActivityAction;

  @Prop({ trim: true })
  resource?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  targetUser?: Types.ObjectId;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ type: Object })
  meta?: Record<string, unknown>;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
