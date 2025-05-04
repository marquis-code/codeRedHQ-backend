import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type HospitalDocument = Hospital & Document;

// Define interface for methods
export interface HospitalMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Define the Hospital type with methods
export type HospitalModel = HospitalDocument & HospitalMethods;

@Schema({ timestamps: true })
export class Hospital {
  // MongoDB automatically adds _id, but we'll define it for TypeScript
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  hospitalName: string;

  @Prop({ required: true })
  contactInformation: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  website: string;

  @Prop({ type: [Object], default: [] })
  operatingHours: Array<{
    day: string;
    open: string;
    close: string;
    is24Hours: boolean;
  }>;

  @Prop()
  facilityType: string;

  @Prop({ type: [String], default: [] })
  availableSpecialties: string[];

  @Prop()
  emergencyServices: string;

  @Prop()
  capacity: string;

  @Prop({ type: [Object], default: [] })
  emergencyEquipment: Array<{
    name: string;
    details: string;
  }>;

  @Prop()
  emergencyContactNumber: string;

  @Prop()
  emergencyDepartment: string;

  @Prop({ type: [Object], default: [] })
  doctorOnDutyContact: Array<{
    specialty: string;
    name: string;
    contact: string;
  }>;

  @Prop({ type: [String], default: [] })
  acceptedInsuranceProviders: string[];

  @Prop({ type: [String], default: [] })
  emergencyPaymentPolicies: string[];

  @Prop()
  expectedResponseTime: string;

  @Prop()
  dedicatedPointOfContact: string;

  @Prop()
  communicationProtocols: string;

  @Prop()
  airAmbulance: string;

  @Prop()
  telemedicineServices: string;

  @Prop({ required: true, type: Number })
  latitude: number;

  @Prop({ required: true, type: Number })
  longitude: number;

   // Add GeoJSON location field
   @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  })
  location: {
    type: string;
    coordinates: number[];
  };
  
  @Prop({ default: true })
  isActive: boolean;
}

export const HospitalSchema = SchemaFactory.createForClass(Hospital);

// Add geospatial index for location-based queries
// HospitalSchema.index({ latitude: 1, longitude: 1 }, { type: '2dsphere' });

// Add proper geospatial index for location-based queries
HospitalSchema.index({ location: '2dsphere' });

// Hash password before saving
HospitalSchema.pre('save', async function(next) {
  const hospital = this as HospitalDocument;

   // Set the GeoJSON location from latitude and longitude
   if (hospital.latitude && hospital.longitude) {
    hospital.location = {
      type: 'Point',
      coordinates: [hospital.longitude, hospital.latitude] // Note: GeoJSON uses [lng, lat] order
    };
  }
  
  // Only hash the password if it has been modified or is new
  if (!hospital.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    hospital.password = await bcrypt.hash(hospital.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords - properly defined as a method
HospitalSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};