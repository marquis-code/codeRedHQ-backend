import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type EmergencyAlertDocument = EmergencyAlert & Document;

@Schema({ timestamps: true })
export class EmergencyAlert {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital', required: true })
  hospital: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ enum: ['High', 'Moderate', 'Low'], default: 'Moderate' })
  severity: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop()
  endTime: Date;

  @Prop({ enum: ['Active', 'Resolved', 'Expired'], default: 'Active' })
  status: string;

  @Prop()
  affectedDepartment: string;

  @Prop({ type: [String], default: [] })
  actions: string[];

  @Prop()
  resolvedBy: string;

  @Prop()
  resolvedAt: Date;
}

export const EmergencyAlertSchema = SchemaFactory.createForClass(EmergencyAlert);