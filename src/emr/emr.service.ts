import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Patient, PatientDocument } from './schemas/emr.schema';
import { MedicalVisit, MedicalVisitDocument } from './schemas/emr.schema';
import { SurgeData, SurgeDataDocument } from './schemas/emr.schema';
import { Staff, StaffDocument } from '../staffing/schemas/staff.schema';
import { Bedspace, BedspaceDocument } from '../bedspace/schemas/bedspace.schema';
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

@Injectable()
export class EMRService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(MedicalVisit.name) private medicalVisitModel: Model<MedicalVisitDocument>,
    @InjectModel(SurgeData.name) private surgeDataModel: Model<SurgeDataDocument>,
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
    @InjectModel(Bedspace.name) private bedspaceModel: Model<BedspaceDocument>,
    private eventEmitter: EventEmitter2,
    private auditLogService: AuditService,
  ) {}

  // Generate unique Medical Record Number
  private async generateMRN(hospitalId: string): Promise<string> {
    const hospitalCode = hospitalId.substring(hospitalId.length - 4).toUpperCase();
    const timestamp = Date.now().toString().substring(7);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `MRN-${hospitalCode}-${timestamp}${random}`;
  }

  // Check staff EMR access permission
  private async checkEMRAccess(staffId: string, requiredLevel: string): Promise<StaffDocument> {
    const staff = await this.staffModel.findById(staffId);
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    if (!staff.isVerified || !staff.isActive) {
      throw new ForbiddenException('Your account is not authorized');
    }

    const accessLevels = ['none', 'read', 'write', 'admin'];
    const requiredIndex = accessLevels.indexOf(requiredLevel);
    const staffIndex = accessLevels.indexOf(staff.emrAccessLevel);

    if (staffIndex < requiredIndex) {
      throw new ForbiddenException(`EMR access denied. Required: ${requiredLevel}, Your level: ${staff.emrAccessLevel}`);
    }

    return staff;
  }

//   // Create Patient
//   async createPatient(
//     createPatientDto: CreatePatientDto,
//     staffId: string
//   ): Promise<PatientDocument> {
//     const staff = await this.checkEMRAccess(staffId, 'write');

//     // Generate MRN
//     const mrn = await this.generateMRN(createPatientDto.hospital.toString());

//     const patient = new this.patientModel({
//       ...createPatientDto,
//       medicalRecordNumber: mrn,
//     });

//     const savedPatient = await patient.save();

//     // Create audit log
//     await this.auditLogService.createLog({
//       hospital: savedPatient.hospital
//       staff: staff._id,
//       action: 'emr_create',
//       resourceType: 'Patient',
//       resourceId: savedPatient._id,
//       newState: savedPatient.toObject(),
//       metadata: {
//         staffName: staff.name,
//         patientMRN: savedPatient.medicalRecordNumber,
//       },
//       status: 'success',
//     });

//     this.eventEmitter.emit('patient.created', {
//       hospitalId: savedPatient.hospital,
//       patient: savedPatient,
//       createdBy: staff._id,
//     });

//     return savedPatient;
//   }

async createPatient(
  createPatientDto: CreatePatientDto,
  staffId: string
): Promise<PatientDocument> {
  const staff = await this.checkEMRAccess(staffId, 'write');

  // Generate MRN
  const mrn = await this.generateMRN(createPatientDto.hospital.toString());

  const patient = new this.patientModel({
    ...createPatientDto,
    medicalRecordNumber: mrn,
  });

  const savedPatient = await patient.save();

  // Create audit log
  await this.auditLogService.createLog({
    hospital: savedPatient.hospital.toString(), // Convert to string
    staff: staff._id.toString(), // Convert to string
    action: 'emr_create',
    resourceType: 'Patient',
    resourceId: savedPatient._id.toString(), // Convert to string
    newState: savedPatient.toObject(),
    metadata: {
      staffName: staff.name,
      patientMRN: savedPatient.medicalRecordNumber,
    },
    status: 'success',
  });

  this.eventEmitter.emit('patient.created', {
    hospitalId: savedPatient.hospital,
    patient: savedPatient,
    createdBy: staff._id,
  });

  return savedPatient;
}


//   // Get Patient by MRN
//   async getPatientByMRN(mrn: string, staffId: string): Promise<PatientDocument> {
//     const staff = await this.checkEMRAccess(staffId, 'read');

//     const patient = await this.patientModel.findOne({
//       medicalRecordNumber: mrn,
//       hospital: staff.hospital,
//     });

//     if (!patient) {
//       throw new NotFoundException('Patient not found');
//     }

//     // Log EMR view
//     await this.auditLogService.createLog({
//       hospital: patient.hospital,
//       staff: staff._id,
//       action: 'emr_view',
//       resourceType: 'Patient',
//       resourceId: patient._id,
//       metadata: {
//         staffName: staff.name,
//         patientMRN: patient.medicalRecordNumber,
//       },
//       status: 'success',
//     });

//     return patient;
//   }

// Get Patient by MRN
async getPatientByMRN(mrn: string, staffId: string): Promise<PatientDocument> {
  const staff = await this.checkEMRAccess(staffId, 'read');

  const patient = await this.patientModel.findOne({
    medicalRecordNumber: mrn,
    hospital: staff.hospital,
  });

  if (!patient) {
    throw new NotFoundException('Patient not found');
  }

  // Log EMR view
  await this.auditLogService.createLog({
    hospital: patient.hospital.toString(), // Convert to string
    staff: staff._id.toString(), // Convert to string
    action: 'emr_view',
    resourceType: 'Patient',
    resourceId: patient._id.toString(), // Convert to string
    metadata: {
      staffName: staff.name,
      patientMRN: patient.medicalRecordNumber,
    },
    status: 'success',
  });

  return patient;
}

  // Search Patients
  async searchPatients(
    hospitalId: string,
    staffId: string,
    query: {
      firstName?: string;
      lastName?: string;
      nationalId?: string;
      phoneNumber?: string;
      status?: string;
    }
  ): Promise<PatientDocument[]> {
    await this.checkEMRAccess(staffId, 'read');

    const searchQuery: any = { hospital: new Types.ObjectId(hospitalId), isActive: true };

    if (query.firstName) {
      searchQuery.firstName = new RegExp(query.firstName, 'i');
    }
    if (query.lastName) {
      searchQuery.lastName = new RegExp(query.lastName, 'i');
    }
    if (query.nationalId) {
      searchQuery.nationalId = query.nationalId;
    }
    if (query.phoneNumber) {
      searchQuery.phoneNumber = query.phoneNumber;
    }
    if (query.status) {
      searchQuery.status = query.status;
    }

    return this.patientModel.find(searchQuery).limit(50).exec();
  }

//   // Create Medical Visit
//   async createMedicalVisit(
//     createVisitDto: CreateMedicalVisitDto,
//     staffId: string
//   ): Promise<MedicalVisitDocument> {
//     const staff = await this.checkEMRAccess(staffId, 'write');

//     // Verify patient exists
//     const patient = await this.patientModel.findById(createVisitDto.patient);
//     if (!patient) {
//       throw new NotFoundException('Patient not found');
//     }

//     // If bedspace is assigned, verify and update it
//     if (createVisitDto.assignedBedspace) {
//       const bedspace = await this.bedspaceModel.findById(createVisitDto.assignedBedspace);
//       if (!bedspace) {
//         throw new NotFoundException('Bedspace not found');
//       }

//       if (bedspace.availableBeds <= 0) {
//         throw new BadRequestException('No available beds in the selected bedspace');
//       }

//       // Update bedspace availability
//       bedspace.availableBeds -= 1;
//       bedspace.occupiedBeds += 1;
//       await bedspace.save();
//     }

//     const visit = new this.medicalVisitModel({
//       ...createVisitDto,
//       visitDate: new Date(),
//       createdBy: staff._id,
//       lastModifiedBy: staff._id,
//     });

//     const savedVisit = await visit.save();

//     // Create audit log
//     await this.auditLogService.createLog({
//       hospital: savedVisit.hospital,
//       staff: staff._id,
//       action: 'emr_create',
//       resourceType: 'MedicalVisit',
//       resourceId: savedVisit._id,
//       newState: savedVisit.toObject(),
//       metadata: {
//         staffName: staff.name,
//         patientId: patient._id,
//         patientMRN: patient.medicalRecordNumber,
//         visitType: savedVisit.visitType,
//       },
//       status: 'success',
//     });

//     this.eventEmitter.emit('medical_visit.created', {
//       hospitalId: savedVisit.hospital,
//       visit: savedVisit,
//       patient,
//       createdBy: staff._id,
//     });

//     // Record surge data
//     await this.recordSurgeData(savedVisit.hospital.toString(), savedVisit);

//     return savedVisit;
//   }

// Create Medical Visit
async createMedicalVisit(
  createVisitDto: CreateMedicalVisitDto,
  staffId: string
): Promise<MedicalVisitDocument> {
  const staff = await this.checkEMRAccess(staffId, 'write');

  // Verify patient exists
  const patient = await this.patientModel.findById(createVisitDto.patient);
  if (!patient) {
    throw new NotFoundException('Patient not found');
  }

  // If bedspace is assigned, verify and update it
  if (createVisitDto.assignedBedspace) {
    const bedspace = await this.bedspaceModel.findById(createVisitDto.assignedBedspace);
    if (!bedspace) {
      throw new NotFoundException('Bedspace not found');
    }

    if (bedspace.availableBeds <= 0) {
      throw new BadRequestException('No available beds in the selected bedspace');
    }

    // Update bedspace availability
    bedspace.availableBeds -= 1;
    bedspace.occupiedBeds += 1;
    await bedspace.save();
  }

  const visit = new this.medicalVisitModel({
    ...createVisitDto,
    visitDate: new Date(),
    createdBy: staff._id,
    lastModifiedBy: staff._id,
  });

  const savedVisit = await visit.save();

  // Create audit log
  await this.auditLogService.createLog({
    hospital: savedVisit.hospital.toString(), // Convert to string
    staff: staff._id.toString(), // Convert to string
    action: 'emr_create',
    resourceType: 'MedicalVisit',
    resourceId: savedVisit._id.toString(), // Convert to string
    newState: savedVisit.toObject(),
    metadata: {
      staffName: staff.name,
      patientId: patient._id.toString(),
      patientMRN: patient.medicalRecordNumber,
      visitType: savedVisit.visitType,
    },
    status: 'success',
  });

  this.eventEmitter.emit('medical_visit.created', {
    hospitalId: savedVisit.hospital,
    visit: savedVisit,
    patient,
    createdBy: staff._id,
  });

  // Record surge data
  await this.recordSurgeData(savedVisit.hospital.toString(), savedVisit);

  return savedVisit;
}


//   // Update Medical Visit
//   async updateMedicalVisit(
//     visitId: string,
//     updateData: Partial<CreateMedicalVisitDto>,
//     staffId: string
//   ): Promise<MedicalVisitDocument> {
//     const staff = await this.checkEMRAccess(staffId, 'write');

//     const visit = await this.medicalVisitModel.findById(visitId);
//     if (!visit) {
//       throw new NotFoundException('Medical visit not found');
//     }

//     const previousState = visit.toObject();

//     Object.assign(visit, updateData);
//     visit.lastModifiedBy = staff._id as any;

//     const updatedVisit = await visit.save();

//     // Create audit log
//     await this.auditLogService.createLog({
//       hospital: visit.hospital,
//       staff: staff._id,
//       action: 'emr_update',
//       resourceType: 'MedicalVisit',
//       resourceId: visit._id,
//       previousState,
//       newState: updatedVisit.toObject(),
//       metadata: {
//         staffName: staff.name,
//       },
//       status: 'success',
//     });

//     return updatedVisit;
//   }

async updateMedicalVisit(
  visitId: string,
  updateData: Partial<CreateMedicalVisitDto>,
  staffId: string
): Promise<MedicalVisitDocument> {
  const staff = await this.checkEMRAccess(staffId, 'write');

  const visit = await this.medicalVisitModel.findById(visitId);
  if (!visit) {
    throw new NotFoundException('Medical visit not found');
  }

  const previousState = visit.toObject();

  Object.assign(visit, updateData);
  visit.lastModifiedBy = staff._id as any;

  const updatedVisit = await visit.save();

  // Create audit log
  await this.auditLogService.createLog({
    hospital: visit.hospital.toString(), // Convert to string
    staff: staff._id.toString(), // Convert to string
    action: 'emr_update',
    resourceType: 'MedicalVisit',
    resourceId: visit._id.toString(), // Convert to string
    previousState,
    newState: updatedVisit.toObject(),
    metadata: {
      staffName: staff.name,
    },
    status: 'success',
  });

  return updatedVisit;
}

  // Get Patient Medical History
  async getPatientHistory(
    patientId: string,
    staffId: string
  ): Promise<{ patient: PatientDocument; visits: MedicalVisitDocument[] }> {
    await this.checkEMRAccess(staffId, 'read');

    const patient = await this.patientModel.findById(patientId);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const visits = await this.medicalVisitModel
      .find({ patient: patientId })
      .populate('attendingPhysician', 'name position department')
      .populate('assignedBedspace', 'departmentName location')
      .sort({ visitDate: -1 })
      .exec();

    return { patient, visits };
  }

  // Record Surge Data
  private async recordSurgeData(hospitalId: string, visit: MedicalVisitDocument): Promise<void> {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hour = now.getHours();

    let surgeRecord = await this.surgeDataModel.findOne({
      hospital: new Types.ObjectId(hospitalId),
      date,
      hour,
    });

    if (!surgeRecord) {
      surgeRecord = new this.surgeDataModel({
        hospital: hospitalId,
        date,
        hour,
        totalVisits: 0,
        emergencyVisits: 0,
        criticalCases: 0,
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
        commonDiagnoses: [],
        departmentData: {},
      });
    }

    surgeRecord.totalVisits += 1;

    if (visit.visitType === 'Emergency') {
      surgeRecord.emergencyVisits += 1;
    }

    if (visit.triage && (visit.triage.priority === 'Critical' || visit.triage.esi <= 2)) {
      surgeRecord.criticalCases += 1;
    }

    if (visit.diagnosis) {
      surgeRecord.commonDiagnoses.push(visit.diagnosis);
    }

    await surgeRecord.save();
  }

  // Get Surge Analytics
  async getSurgeAnalytics(
    hospitalId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const surgeData = await this.surgeDataModel.aggregate([
      {
        $match: {
          hospital: new Types.ObjectId(hospitalId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: '$date',
            hour: '$hour',
          },
          totalVisits: { $sum: '$totalVisits' },
          emergencyVisits: { $sum: '$emergencyVisits' },
          criticalCases: { $sum: '$criticalCases' },
          avgBedOccupancy: { $avg: '$bedOccupancyRate' },
          avgWaitTime: { $avg: '$averageWaitTime' },
        },
      },
      {
        $sort: { '_id.date': 1, '_id.hour': 1 },
      },
    ]);

    // Calculate peak hours
    const hourlyStats = {};
    surgeData.forEach(record => {
      const hour = record._id.hour;
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = {
          hour,
          totalVisits: 0,
          emergencyVisits: 0,
          criticalCases: 0,
          count: 0,
        };
      }
      hourlyStats[hour].totalVisits += record.totalVisits;
      hourlyStats[hour].emergencyVisits += record.emergencyVisits;
      hourlyStats[hour].criticalCases += record.criticalCases;
      hourlyStats[hour].count += 1;
    });

    const peakHours = Object.values(hourlyStats)
      .map((stat: any) => ({
        hour: stat.hour,
        avgVisits: stat.totalVisits / stat.count,
        avgEmergencies: stat.emergencyVisits / stat.count,
        avgCritical: stat.criticalCases / stat.count,
      }))
      .sort((a, b) => b.avgVisits - a.avgVisits)
      .slice(0, 5);

    return {
      timeRange: { startDate, endDate },
      summary: {
        totalRecords: surgeData.length,
        totalVisits: surgeData.reduce((sum, r) => sum + r.totalVisits, 0),
        totalEmergencies: surgeData.reduce((sum, r) => sum + r.emergencyVisits, 0),
        totalCritical: surgeData.reduce((sum, r) => sum + r.criticalCases, 0),
      },
      peakHours,
      dailyTrends: surgeData,
    };
  }

  // Discharge Patient
  async dischargePatient(
    visitId: string,
    dischargeSummary: string,
    staffId: string
  ): Promise<MedicalVisitDocument> {
    const staff = await this.checkEMRAccess(staffId, 'write');

    const visit = await this.medicalVisitModel.findById(visitId);
    if (!visit) {
      throw new NotFoundException('Medical visit not found');
    }

    // Update bedspace if assigned
    if (visit.assignedBedspace) {
      const bedspace = await this.bedspaceModel.findById(visit.assignedBedspace);
      if (bedspace) {
        bedspace.availableBeds += 1;
        bedspace.occupiedBeds -= 1;
        await bedspace.save();
      }
    }

    visit.status = 'Completed';
    visit.dischargeDate = new Date();
    visit.dischargeSummary = dischargeSummary;
    visit.lastModifiedBy = staff._id as any;

    const updatedVisit = await visit.save();

    // Update patient status
    const patient = await this.patientModel.findById(visit.patient);
    if (patient) {
      patient.status = 'Discharged';
      await patient.save();
    }

    this.eventEmitter.emit('patient.discharged', {
      hospitalId: visit.hospital,
      visit: updatedVisit,
      patient,
      dischargedBy: staff._id,
    });

    return updatedVisit;
  }
}