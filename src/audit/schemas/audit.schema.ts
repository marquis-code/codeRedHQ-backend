import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital', required: true })
  hospital: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  module: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  resourceId: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  previousState: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  newState: any;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop()
  performedBy: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Index for faster queries
AuditLogSchema.index({ hospital: 1, createdAt: -1 });
AuditLogSchema.index({ module: 1, action: 1 });