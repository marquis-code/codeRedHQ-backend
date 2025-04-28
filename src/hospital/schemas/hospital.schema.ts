import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type HospitalDocument = Hospital & Document;

@Schema({ timestamps: true })
export class Hospital {
  @Prop({ required: true, unique: true })
  uuid: string;

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
  
  @Prop({ default: true })
  isActive: boolean;
}

export const HospitalSchema = SchemaFactory.createForClass(Hospital);

// Hash password before saving
HospitalSchema.pre('save', async function(next) {
  const hospital = this as HospitalDocument;
  
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

// Method to compare passwords
HospitalSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};