import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Hospital } from '../../hospital/schemas/hospital.schema';

export type SurgeDocument = Surge & Document;

@Schema({ timestamps: true })
export class Surge {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital', required: true })
  hospital: Hospital;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop()
  address: string;

  @Prop({ default: 'pending' })
  status: string;

  @Prop()
  emergencyType: string;

  @Prop()
  description: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const SurgeSchema = SchemaFactory.createForClass(Surge);

// Add geospatial index for location-based queries
SurgeSchema.index({ latitude: 1, longitude: 1 });