import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PatientDocument = Patient & Document;

@Schema({ timestamps: true })
export class Patient {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital', required: true })
  hospital: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop({ enum: ['Male', 'Female', 'Other'], required: true })
  gender: string;

  @Prop({ required: true, unique: true })
  medicalRecordNumber: string;

  @Prop()
  nationalId: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  email: string;

  @Prop({ type: Object })
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };

  @Prop()
  bloodType: string;

  @Prop({ type: [String], default: [] })
  allergies: string[];

  @Prop({ type: [String], default: [] })
  chronicConditions: string[];

  @Prop({ type: [Object], default: [] })
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phoneNumber: string;
  }>;

  @Prop({ type: [Object], default: [] })
  insuranceInfo: Array<{
    provider: string;
    policyNumber: string;
    groupNumber: string;
    validUntil: Date;
  }>;

  @Prop({ enum: ['Active', 'Discharged', 'Deceased', 'Transferred'], default: 'Active' })
  status: string;

  @Prop({ default: true })
  isActive: boolean;

  // Add timestamp fields
  createdAt?: Date;
  updatedAt?: Date;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);

PatientSchema.index({ hospital: 1, medicalRecordNumber: 1 }, { unique: true });
PatientSchema.index({ nationalId: 1 });
PatientSchema.index({ firstName: 1, lastName: 1 });

// Virtual for full name - type 'this' properly
PatientSchema.virtual('fullName').get(function(this: PatientDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age - type 'this' properly
PatientSchema.virtual('age').get(function(this: PatientDocument) {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Medical Visit Schema
export type MedicalVisitDocument = MedicalVisit & Document;

@Schema({ timestamps: true })
export class MedicalVisit {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
  patient: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital', required: true })
  hospital: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Staff' })
  attendingPhysician: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  visitDate: Date;

  @Prop({ 
    enum: ['Emergency', 'Outpatient', 'Inpatient', 'Follow-up', 'Consultation'],
    required: true 
  })
  visitType: string;

  @Prop()
  chiefComplaint: string;

  @Prop()
  presentingSymptoms: string;

  @Prop({ type: Object })
  vitalSigns: {
    temperature: number;
    bloodPressure: string;
    heartRate: number;
    respiratoryRate: number;
    oxygenSaturation: number;
    weight: number;
    height: number;
  };

  @Prop()
  diagnosis: string;

  @Prop({ type: [String], default: [] })
  diagnosisCodes: string[];

  @Prop()
  treatmentPlan: string;

  @Prop({ type: [Object], default: [] })
  prescriptions: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;

  @Prop({ type: [Object], default: [] })
  procedures: Array<{
    name: string;
    code: string;
    performedBy: MongooseSchema.Types.ObjectId;
    performedAt: Date;
    notes: string;
  }>;

  @Prop({ type: [Object], default: [] })
  labResults: Array<{
    testName: string;
    result: string;
    normalRange: string;
    date: Date;
    orderedBy: MongooseSchema.Types.ObjectId;
  }>;

  @Prop({ type: [Object], default: [] })
  imagingResults: Array<{
    studyType: string;
    findings: string;
    date: Date;
    radiologist: string;
  }>;

  @Prop()
  notes: string;

  @Prop()
  followUpDate: Date;

  @Prop({ 
    enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
    default: 'In Progress'
  })
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Bedspace' })
  assignedBedspace: MongooseSchema.Types.ObjectId;

  @Prop()
  admissionDate: Date;

  @Prop()
  dischargeDate: Date;

  @Prop()
  dischargeSummary: string;

  @Prop({ type: Object })
  triage: {
    priority: string;
    triageTime: Date;
    triageNurse: MongooseSchema.Types.ObjectId;
    esi: number;
  };

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Staff' })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Staff' })
  lastModifiedBy: MongooseSchema.Types.ObjectId;

  // Add timestamp fields
  createdAt?: Date;
  updatedAt?: Date;
}

export const MedicalVisitSchema = SchemaFactory.createForClass(MedicalVisit);

MedicalVisitSchema.index({ patient: 1, visitDate: -1 });
MedicalVisitSchema.index({ hospital: 1, visitDate: -1 });
MedicalVisitSchema.index({ attendingPhysician: 1, visitDate: -1 });
MedicalVisitSchema.index({ visitType: 1, status: 1 });

// Surge Data Schema for AI predictions
export type SurgeDataDocument = SurgeData & Document;

@Schema({ timestamps: true })
export class SurgeData {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Hospital', required: true })
  hospital: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  hour: number;

  @Prop({ required: true })
  totalVisits: number;

  @Prop({ required: true })
  emergencyVisits: number;

  @Prop({ default: 0 })
  criticalCases: number;

  @Prop({ default: 0 })
  bedOccupancyRate: number;

  @Prop({ default: 0 })
  averageWaitTime: number;

  @Prop({ type: [String], default: [] })
  commonDiagnoses: string[];

  @Prop({ type: Object })
  departmentData: {
    emergency: { visits: number; waitTime: number };
    icu: { occupancy: number; admissions: number };
    surgery: { procedures: number; waitTime: number };
    [key: string]: any;
  };

  @Prop({ type: Object })
  weatherData: {
    temperature: number;
    condition: string;
    humidity: number;
  };

  @Prop()
  dayOfWeek: string;

  @Prop()
  isHoliday: boolean;

  @Prop({ type: Object })
  predictedSurge: {
    likelihood: number;
    severity: string;
    confidence: number;
  };

  // Add timestamp fields
  createdAt?: Date;
  updatedAt?: Date;
}

export const SurgeDataSchema = SchemaFactory.createForClass(SurgeData);

SurgeDataSchema.index({ hospital: 1, date: -1, hour: -1 });
SurgeDataSchema.index({ hospital: 1, date: -1 });