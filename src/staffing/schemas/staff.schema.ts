import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type StaffDocument = Staff & Document;

@Schema({ timestamps: true })
export class Staff {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital', required: true })
  hospital: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  position: string;

  @Prop({ required: true })
  department: string;

  @Prop({ enum: ['Available', 'Unavailable'], default: 'Available' })
  availability: string;

  @Prop()
  contactNumber: string;

  @Prop()
  email: string;

  @Prop({ type: [{ date: Date, shift: String, status: String }], default: [] })
  schedule: Array<{
    date: Date;
    shift: string;
    status: string;
  }>;

  @Prop({ type: Object, default: {} })
  specializations: Record<string, any>;

  @Prop({ default: true })
  isActive: boolean;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);