"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMRService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const event_emitter_1 = require("@nestjs/event-emitter");
const emr_schema_1 = require("./schemas/emr.schema");
const emr_schema_2 = require("./schemas/emr.schema");
const emr_schema_3 = require("./schemas/emr.schema");
const staff_schema_1 = require("../staffing/schemas/staff.schema");
const bedspace_schema_1 = require("../bedspace/schemas/bedspace.schema");
const audit_service_1 = require("../audit/audit.service");
let EMRService = class EMRService {
    constructor(patientModel, medicalVisitModel, surgeDataModel, staffModel, bedspaceModel, eventEmitter, auditLogService) {
        this.patientModel = patientModel;
        this.medicalVisitModel = medicalVisitModel;
        this.surgeDataModel = surgeDataModel;
        this.staffModel = staffModel;
        this.bedspaceModel = bedspaceModel;
        this.eventEmitter = eventEmitter;
        this.auditLogService = auditLogService;
    }
    async generateMRN(hospitalId) {
        const hospitalCode = hospitalId.substring(hospitalId.length - 4).toUpperCase();
        const timestamp = Date.now().toString().substring(7);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `MRN-${hospitalCode}-${timestamp}${random}`;
    }
    async checkEMRAccess(staffId, requiredLevel) {
        const staff = await this.staffModel.findById(staffId);
        if (!staff) {
            throw new common_1.NotFoundException('Staff not found');
        }
        if (!staff.isVerified || !staff.isActive) {
            throw new common_1.ForbiddenException('Your account is not authorized');
        }
        const accessLevels = ['none', 'read', 'write', 'admin'];
        const requiredIndex = accessLevels.indexOf(requiredLevel);
        const staffIndex = accessLevels.indexOf(staff.emrAccessLevel);
        if (staffIndex < requiredIndex) {
            throw new common_1.ForbiddenException(`EMR access denied. Required: ${requiredLevel}, Your level: ${staff.emrAccessLevel}`);
        }
        return staff;
    }
    async createPatient(createPatientDto, staffId) {
        const staff = await this.checkEMRAccess(staffId, 'write');
        const mrn = await this.generateMRN(createPatientDto.hospital.toString());
        const patient = new this.patientModel(Object.assign(Object.assign({}, createPatientDto), { medicalRecordNumber: mrn }));
        const savedPatient = await patient.save();
        await this.auditLogService.createLog({
            hospital: savedPatient.hospital.toString(),
            staff: staff._id.toString(),
            action: 'emr_create',
            resourceType: 'Patient',
            resourceId: savedPatient._id.toString(),
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
    async getPatientByMRN(mrn, staffId) {
        const staff = await this.checkEMRAccess(staffId, 'read');
        const patient = await this.patientModel.findOne({
            medicalRecordNumber: mrn,
            hospital: staff.hospital,
        });
        if (!patient) {
            throw new common_1.NotFoundException('Patient not found');
        }
        await this.auditLogService.createLog({
            hospital: patient.hospital.toString(),
            staff: staff._id.toString(),
            action: 'emr_view',
            resourceType: 'Patient',
            resourceId: patient._id.toString(),
            metadata: {
                staffName: staff.name,
                patientMRN: patient.medicalRecordNumber,
            },
            status: 'success',
        });
        return patient;
    }
    async searchPatients(hospitalId, staffId, query) {
        await this.checkEMRAccess(staffId, 'read');
        const searchQuery = { hospital: new mongoose_2.Types.ObjectId(hospitalId), isActive: true };
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
    async createMedicalVisit(createVisitDto, staffId) {
        const staff = await this.checkEMRAccess(staffId, 'write');
        const patient = await this.patientModel.findById(createVisitDto.patient);
        if (!patient) {
            throw new common_1.NotFoundException('Patient not found');
        }
        if (createVisitDto.assignedBedspace) {
            const bedspace = await this.bedspaceModel.findById(createVisitDto.assignedBedspace);
            if (!bedspace) {
                throw new common_1.NotFoundException('Bedspace not found');
            }
            if (bedspace.availableBeds <= 0) {
                throw new common_1.BadRequestException('No available beds in the selected bedspace');
            }
            bedspace.availableBeds -= 1;
            bedspace.occupiedBeds += 1;
            await bedspace.save();
        }
        const visit = new this.medicalVisitModel(Object.assign(Object.assign({}, createVisitDto), { visitDate: new Date(), createdBy: staff._id, lastModifiedBy: staff._id }));
        const savedVisit = await visit.save();
        await this.auditLogService.createLog({
            hospital: savedVisit.hospital.toString(),
            staff: staff._id.toString(),
            action: 'emr_create',
            resourceType: 'MedicalVisit',
            resourceId: savedVisit._id.toString(),
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
        await this.recordSurgeData(savedVisit.hospital.toString(), savedVisit);
        return savedVisit;
    }
    async updateMedicalVisit(visitId, updateData, staffId) {
        const staff = await this.checkEMRAccess(staffId, 'write');
        const visit = await this.medicalVisitModel.findById(visitId);
        if (!visit) {
            throw new common_1.NotFoundException('Medical visit not found');
        }
        const previousState = visit.toObject();
        Object.assign(visit, updateData);
        visit.lastModifiedBy = staff._id;
        const updatedVisit = await visit.save();
        await this.auditLogService.createLog({
            hospital: visit.hospital.toString(),
            staff: staff._id.toString(),
            action: 'emr_update',
            resourceType: 'MedicalVisit',
            resourceId: visit._id.toString(),
            previousState,
            newState: updatedVisit.toObject(),
            metadata: {
                staffName: staff.name,
            },
            status: 'success',
        });
        return updatedVisit;
    }
    async getPatientHistory(patientId, staffId) {
        await this.checkEMRAccess(staffId, 'read');
        const patient = await this.patientModel.findById(patientId);
        if (!patient) {
            throw new common_1.NotFoundException('Patient not found');
        }
        const visits = await this.medicalVisitModel
            .find({ patient: patientId })
            .populate('attendingPhysician', 'name position department')
            .populate('assignedBedspace', 'departmentName location')
            .sort({ visitDate: -1 })
            .exec();
        return { patient, visits };
    }
    async recordSurgeData(hospitalId, visit) {
        const now = new Date();
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const hour = now.getHours();
        let surgeRecord = await this.surgeDataModel.findOne({
            hospital: new mongoose_2.Types.ObjectId(hospitalId),
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
    async getSurgeAnalytics(hospitalId, startDate, endDate) {
        const surgeData = await this.surgeDataModel.aggregate([
            {
                $match: {
                    hospital: new mongoose_2.Types.ObjectId(hospitalId),
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
            .map((stat) => ({
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
    async dischargePatient(visitId, dischargeSummary, staffId) {
        const staff = await this.checkEMRAccess(staffId, 'write');
        const visit = await this.medicalVisitModel.findById(visitId);
        if (!visit) {
            throw new common_1.NotFoundException('Medical visit not found');
        }
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
        visit.lastModifiedBy = staff._id;
        const updatedVisit = await visit.save();
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
};
EMRService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(emr_schema_1.Patient.name)),
    __param(1, (0, mongoose_1.InjectModel)(emr_schema_2.MedicalVisit.name)),
    __param(2, (0, mongoose_1.InjectModel)(emr_schema_3.SurgeData.name)),
    __param(3, (0, mongoose_1.InjectModel)(staff_schema_1.Staff.name)),
    __param(4, (0, mongoose_1.InjectModel)(bedspace_schema_1.Bedspace.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        event_emitter_1.EventEmitter2,
        audit_service_1.AuditService])
], EMRService);
exports.EMRService = EMRService;
//# sourceMappingURL=emr.service.js.map