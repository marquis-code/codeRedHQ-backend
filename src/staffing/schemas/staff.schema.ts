
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcrypt';

// Define the methods interface
export interface StaffMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Update the document type to include methods
export type StaffDocument = Staff & Document & StaffMethods;

@Schema({ timestamps: true })
export class Staff {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital', required: true })
  hospital: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  position: string;

  @Prop({ required: true })
  department: string;

  @Prop({ enum: ['Available', 'Unavailable', 'On Shift', 'Off Shift'], default: 'Off Shift' })
  availability: string;

  @Prop()
  contactNumber: string;

  @Prop({ type: [{ date: Date, shift: String, status: String }], default: [] })
  schedule: Array<{
    date: Date;
    shift: string;
    status: string;
  }>;

  @Prop({ type: Object, default: {} })
  specializations: Record<string, any>;

  @Prop({ type: [Object], default: [] })
  attendanceHistory: Array<{
    clockInTime: Date;
    clockOutTime?: Date;
    clockInLocation: {
      type: string;
      coordinates: number[];
    };
    clockOutLocation?: {
      type: string;
      coordinates: number[];
    };
    distanceFromHospital: number;
    shift: string;
    status: 'active' | 'completed';
    notes?: string;
  }>;

  @Prop({ type: Object, default: null })
  currentShift: {
    clockInTime: Date;
    clockInLocation: {
      type: string;
      coordinates: number[];
    };
    distanceFromHospital: number;
    shift: string;
  } | null;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ enum: ['none', 'read', 'write', 'admin'], default: 'none' })
  emrAccessLevel: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  })
  lastKnownLocation: {
    type: string;
    coordinates: number[];
  };

  @Prop()
  lastLocationUpdate: Date;

  // Add timestamp fields
  createdAt?: Date;
  updatedAt?: Date;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);

// Add geospatial index for location-based queries
StaffSchema.index({ lastKnownLocation: '2dsphere' });
StaffSchema.index({ hospital: 1, email: 1 }, { unique: true });

// Hash password before saving
StaffSchema.pre('save', async function(next) {
  const staff = this as StaffDocument;

  // Only hash the password if it has been modified or is new
  if (!staff.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    staff.password = await bcrypt.hash(staff.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
StaffSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};