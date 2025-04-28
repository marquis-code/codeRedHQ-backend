import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Types } from 'mongoose';

// Define the interface for the document, which extends Document and Bedspace
export interface BedspaceDocument extends Document, Bedspace {}

@Schema({ timestamps: true })
export class Bedspace {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital', required: true })
  hospital: Types.ObjectId;

  @Prop({ required: true })
  departmentName: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  totalBeds: number;

  @Prop({ required: true, default: 0 })
  availableBeds: number;

  @Prop({ required: true, default: 0 })
  occupiedBeds: number;

  @Prop()
  lastUpdated: Date;

  @Prop({ enum: ['Available', 'Limited', 'Unavailable'], default: 'Available' })
  status: string;

  @Prop({ type: [{ date: Date, available: Number, occupied: Number }], default: [] })
  history: Array<{
    date: Date;
    available: number;
    occupied: number;
  }>;
}

export const BedspaceSchema = SchemaFactory.createForClass(Bedspace);

// Calculate status based on available beds
BedspaceSchema.pre('save', function (next) {
  const bedspace = this as BedspaceDocument;
  
  // Update lastUpdated timestamp
  bedspace.lastUpdated = new Date();
  
  // Calculate occupancy percentage
  const occupancyPercentage = (bedspace.occupiedBeds / bedspace.totalBeds) * 100;
  
  // Set status based on occupancy
  if (bedspace.availableBeds === 0) {
    bedspace.status = 'Unavailable';
  } else if (occupancyPercentage >= 80) {
    bedspace.status = 'Limited';
  } else {
    bedspace.status = 'Available';
  }
  
  // Add to history
  bedspace.history.push({
    date: new Date(),
    available: bedspace.availableBeds,
    occupied: bedspace.occupiedBeds
  });
  
  // Limit history to last 100 entries
  if (bedspace.history.length > 100) {
    bedspace.history = bedspace.history.slice(-100);
  }
  
  next();
});
