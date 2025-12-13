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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurgeDataSchema = exports.SurgeData = exports.MedicalVisitSchema = exports.MedicalVisit = exports.PatientSchema = exports.Patient = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Patient = class Patient {
};
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Hospital', required: true }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], Patient.prototype, "hospital", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Patient.prototype, "firstName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Patient.prototype, "lastName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Patient.prototype, "dateOfBirth", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['Male', 'Female', 'Other'], required: true }),
    __metadata("design:type", String)
], Patient.prototype, "gender", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Patient.prototype, "medicalRecordNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "nationalId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "phoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], Patient.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "bloodType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Patient.prototype, "allergies", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Patient.prototype, "chronicConditions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], Patient.prototype, "emergencyContacts", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], Patient.prototype, "insuranceInfo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['Active', 'Discharged', 'Deceased', 'Transferred'], default: 'Active' }),
    __metadata("design:type", String)
], Patient.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Patient.prototype, "isActive", void 0);
Patient = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Patient);
exports.Patient = Patient;
exports.PatientSchema = mongoose_1.SchemaFactory.createForClass(Patient);
exports.PatientSchema.index({ hospital: 1, medicalRecordNumber: 1 }, { unique: true });
exports.PatientSchema.index({ nationalId: 1 });
exports.PatientSchema.index({ firstName: 1, lastName: 1 });
exports.PatientSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});
exports.PatientSchema.virtual('age').get(function () {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});
let MedicalVisit = class MedicalVisit {
};
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Patient', required: true }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], MedicalVisit.prototype, "patient", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Hospital', required: true }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], MedicalVisit.prototype, "hospital", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Staff' }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], MedicalVisit.prototype, "attendingPhysician", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], MedicalVisit.prototype, "visitDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: ['Emergency', 'Outpatient', 'Inpatient', 'Follow-up', 'Consultation'],
        required: true
    }),
    __metadata("design:type", String)
], MedicalVisit.prototype, "visitType", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalVisit.prototype, "chiefComplaint", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalVisit.prototype, "presentingSymptoms", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], MedicalVisit.prototype, "vitalSigns", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalVisit.prototype, "diagnosis", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], MedicalVisit.prototype, "diagnosisCodes", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalVisit.prototype, "treatmentPlan", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], MedicalVisit.prototype, "prescriptions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], MedicalVisit.prototype, "procedures", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], MedicalVisit.prototype, "labResults", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], MedicalVisit.prototype, "imagingResults", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalVisit.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], MedicalVisit.prototype, "followUpDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
        default: 'In Progress'
    }),
    __metadata("design:type", String)
], MedicalVisit.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Bedspace' }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], MedicalVisit.prototype, "assignedBedspace", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], MedicalVisit.prototype, "admissionDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], MedicalVisit.prototype, "dischargeDate", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], MedicalVisit.prototype, "dischargeSummary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], MedicalVisit.prototype, "triage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Staff' }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], MedicalVisit.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Staff' }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], MedicalVisit.prototype, "lastModifiedBy", void 0);
MedicalVisit = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], MedicalVisit);
exports.MedicalVisit = MedicalVisit;
exports.MedicalVisitSchema = mongoose_1.SchemaFactory.createForClass(MedicalVisit);
exports.MedicalVisitSchema.index({ patient: 1, visitDate: -1 });
exports.MedicalVisitSchema.index({ hospital: 1, visitDate: -1 });
exports.MedicalVisitSchema.index({ attendingPhysician: 1, visitDate: -1 });
exports.MedicalVisitSchema.index({ visitType: 1, status: 1 });
let SurgeData = class SurgeData {
};
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Hospital', required: true }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], SurgeData.prototype, "hospital", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], SurgeData.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], SurgeData.prototype, "hour", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], SurgeData.prototype, "totalVisits", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], SurgeData.prototype, "emergencyVisits", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], SurgeData.prototype, "criticalCases", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], SurgeData.prototype, "bedOccupancyRate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], SurgeData.prototype, "averageWaitTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], SurgeData.prototype, "commonDiagnoses", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], SurgeData.prototype, "departmentData", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], SurgeData.prototype, "weatherData", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SurgeData.prototype, "dayOfWeek", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Boolean)
], SurgeData.prototype, "isHoliday", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], SurgeData.prototype, "predictedSurge", void 0);
SurgeData = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], SurgeData);
exports.SurgeData = SurgeData;
exports.SurgeDataSchema = mongoose_1.SchemaFactory.createForClass(SurgeData);
exports.SurgeDataSchema.index({ hospital: 1, date: -1, hour: -1 });
exports.SurgeDataSchema.index({ hospital: 1, date: -1 });
//# sourceMappingURL=emr.schema.js.map