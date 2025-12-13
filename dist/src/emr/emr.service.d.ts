import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PatientDocument } from './schemas/emr.schema';
import { MedicalVisitDocument } from './schemas/emr.schema';
import { SurgeDataDocument } from './schemas/emr.schema';
import { StaffDocument } from '../staffing/schemas/staff.schema';
import { BedspaceDocument } from '../bedspace/schemas/bedspace.schema';
import { AuditService } from '../audit/audit.service';
export interface CreatePatientDto {
    hospital: Types.ObjectId | string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    nationalId?: string;
    phoneNumber?: string;
    email?: string;
    address?: any;
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    emergencyContacts?: any[];
    insuranceInfo?: any[];
}
export interface CreateMedicalVisitDto {
    patient: Types.ObjectId | string;
    hospital: Types.ObjectId | string;
    attendingPhysician?: Types.ObjectId | string;
    visitType: string;
    chiefComplaint?: string;
    presentingSymptoms?: string;
    vitalSigns?: any;
    diagnosis?: string;
    diagnosisCodes?: string[];
    treatmentPlan?: string;
    prescriptions?: any[];
    procedures?: any[];
    triage?: any;
    assignedBedspace?: Types.ObjectId | string;
}
export declare class EMRService {
    private patientModel;
    private medicalVisitModel;
    private surgeDataModel;
    private staffModel;
    private bedspaceModel;
    private eventEmitter;
    private auditLogService;
    constructor(patientModel: Model<PatientDocument>, medicalVisitModel: Model<MedicalVisitDocument>, surgeDataModel: Model<SurgeDataDocument>, staffModel: Model<StaffDocument>, bedspaceModel: Model<BedspaceDocument>, eventEmitter: EventEmitter2, auditLogService: AuditService);
    private generateMRN;
    private checkEMRAccess;
    createPatient(createPatientDto: CreatePatientDto, staffId: string): Promise<PatientDocument>;
    getPatientByMRN(mrn: string, staffId: string): Promise<PatientDocument>;
    searchPatients(hospitalId: string, staffId: string, query: {
        firstName?: string;
        lastName?: string;
        nationalId?: string;
        phoneNumber?: string;
        status?: string;
    }): Promise<PatientDocument[]>;
    createMedicalVisit(createVisitDto: CreateMedicalVisitDto, staffId: string): Promise<MedicalVisitDocument>;
    updateMedicalVisit(visitId: string, updateData: Partial<CreateMedicalVisitDto>, staffId: string): Promise<MedicalVisitDocument>;
    getPatientHistory(patientId: string, staffId: string): Promise<{
        patient: PatientDocument;
        visits: MedicalVisitDocument[];
    }>;
    private recordSurgeData;
    getSurgeAnalytics(hospitalId: string, startDate: Date, endDate: Date): Promise<any>;
    dischargePatient(visitId: string, dischargeSummary: string, staffId: string): Promise<MedicalVisitDocument>;
}
