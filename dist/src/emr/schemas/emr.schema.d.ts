/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose/types/inferschematype" />
import { Document, Schema as MongooseSchema } from 'mongoose';
export type PatientDocument = Patient & Document;
export declare class Patient {
    hospital: MongooseSchema.Types.ObjectId;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    medicalRecordNumber: string;
    nationalId: string;
    phoneNumber: string;
    email: string;
    address: {
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
    };
    bloodType: string;
    allergies: string[];
    chronicConditions: string[];
    emergencyContacts: Array<{
        name: string;
        relationship: string;
        phoneNumber: string;
    }>;
    insuranceInfo: Array<{
        provider: string;
        policyNumber: string;
        groupNumber: string;
        validUntil: Date;
    }>;
    status: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const PatientSchema: MongooseSchema<Document<Patient, any, any>, import("mongoose").Model<Document<Patient, any, any>, any, any, any, Document<unknown, any, Document<Patient, any, any>> & Document<Patient, any, any> & Required<{
    _id: Patient;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Document<Patient, any, any>, Document<unknown, {}, import("mongoose").FlatRecord<Document<Patient, any, any>>> & import("mongoose").FlatRecord<Document<Patient, any, any>> & Required<{
    _id: Patient;
}>>;
export type MedicalVisitDocument = MedicalVisit & Document;
export declare class MedicalVisit {
    patient: MongooseSchema.Types.ObjectId;
    hospital: MongooseSchema.Types.ObjectId;
    attendingPhysician: MongooseSchema.Types.ObjectId;
    visitDate: Date;
    visitType: string;
    chiefComplaint: string;
    presentingSymptoms: string;
    vitalSigns: {
        temperature: number;
        bloodPressure: string;
        heartRate: number;
        respiratoryRate: number;
        oxygenSaturation: number;
        weight: number;
        height: number;
    };
    diagnosis: string;
    diagnosisCodes: string[];
    treatmentPlan: string;
    prescriptions: Array<{
        medication: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions: string;
    }>;
    procedures: Array<{
        name: string;
        code: string;
        performedBy: MongooseSchema.Types.ObjectId;
        performedAt: Date;
        notes: string;
    }>;
    labResults: Array<{
        testName: string;
        result: string;
        normalRange: string;
        date: Date;
        orderedBy: MongooseSchema.Types.ObjectId;
    }>;
    imagingResults: Array<{
        studyType: string;
        findings: string;
        date: Date;
        radiologist: string;
    }>;
    notes: string;
    followUpDate: Date;
    status: string;
    assignedBedspace: MongooseSchema.Types.ObjectId;
    admissionDate: Date;
    dischargeDate: Date;
    dischargeSummary: string;
    triage: {
        priority: string;
        triageTime: Date;
        triageNurse: MongooseSchema.Types.ObjectId;
        esi: number;
    };
    createdBy: MongooseSchema.Types.ObjectId;
    lastModifiedBy: MongooseSchema.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const MedicalVisitSchema: MongooseSchema<Document<MedicalVisit, any, any>, import("mongoose").Model<Document<MedicalVisit, any, any>, any, any, any, Document<unknown, any, Document<MedicalVisit, any, any>> & Document<MedicalVisit, any, any> & Required<{
    _id: MedicalVisit;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Document<MedicalVisit, any, any>, Document<unknown, {}, import("mongoose").FlatRecord<Document<MedicalVisit, any, any>>> & import("mongoose").FlatRecord<Document<MedicalVisit, any, any>> & Required<{
    _id: MedicalVisit;
}>>;
export type SurgeDataDocument = SurgeData & Document;
export declare class SurgeData {
    hospital: MongooseSchema.Types.ObjectId;
    date: Date;
    hour: number;
    totalVisits: number;
    emergencyVisits: number;
    criticalCases: number;
    bedOccupancyRate: number;
    averageWaitTime: number;
    commonDiagnoses: string[];
    departmentData: {
        emergency: {
            visits: number;
            waitTime: number;
        };
        icu: {
            occupancy: number;
            admissions: number;
        };
        surgery: {
            procedures: number;
            waitTime: number;
        };
        [key: string]: any;
    };
    weatherData: {
        temperature: number;
        condition: string;
        humidity: number;
    };
    dayOfWeek: string;
    isHoliday: boolean;
    predictedSurge: {
        likelihood: number;
        severity: string;
        confidence: number;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const SurgeDataSchema: MongooseSchema<Document<SurgeData, any, any>, import("mongoose").Model<Document<SurgeData, any, any>, any, any, any, Document<unknown, any, Document<SurgeData, any, any>> & Document<SurgeData, any, any> & Required<{
    _id: SurgeData;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Document<SurgeData, any, any>, Document<unknown, {}, import("mongoose").FlatRecord<Document<SurgeData, any, any>>> & import("mongoose").FlatRecord<Document<SurgeData, any, any>> & Required<{
    _id: SurgeData;
}>>;
