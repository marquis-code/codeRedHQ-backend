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
exports.EMRController = void 0;
const common_1 = require("@nestjs/common");
const emr_service_1 = require("./emr.service");
let EMRController = class EMRController {
    constructor(emrService) {
        this.emrService = emrService;
    }
    async createPatient(createPatientDto, req) {
        var _a;
        const staffId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        return this.emrService.createPatient(createPatientDto, staffId);
    }
    async getPatientByMRN(mrn, req) {
        var _a;
        const staffId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        return this.emrService.getPatientByMRN(mrn, staffId);
    }
    async searchPatients(hospitalId, firstName, lastName, nationalId, phoneNumber, status, req) {
        var _a;
        const staffId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        return this.emrService.searchPatients(hospitalId, staffId, {
            firstName,
            lastName,
            nationalId,
            phoneNumber,
            status,
        });
    }
    async getPatientHistory(patientId, req) {
        var _a;
        const staffId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        return this.emrService.getPatientHistory(patientId, staffId);
    }
    async createMedicalVisit(createVisitDto, req) {
        var _a;
        const staffId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        return this.emrService.createMedicalVisit(createVisitDto, staffId);
    }
    async updateMedicalVisit(visitId, updateData, req) {
        var _a;
        const staffId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        return this.emrService.updateMedicalVisit(visitId, updateData, staffId);
    }
    async dischargePatient(visitId, body, req) {
        var _a;
        const staffId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sub;
        return this.emrService.dischargePatient(visitId, body.dischargeSummary, staffId);
    }
    async getSurgeAnalytics(hospitalId, startDate, endDate) {
        return this.emrService.getSurgeAnalytics(hospitalId, new Date(startDate), new Date(endDate));
    }
};
__decorate([
    (0, common_1.Post)('patients'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EMRController.prototype, "createPatient", null);
__decorate([
    (0, common_1.Get)('patients/mrn/:mrn'),
    __param(0, (0, common_1.Param)('mrn')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EMRController.prototype, "getPatientByMRN", null);
__decorate([
    (0, common_1.Get)('patients/search'),
    __param(0, (0, common_1.Query)('hospitalId')),
    __param(1, (0, common_1.Query)('firstName')),
    __param(2, (0, common_1.Query)('lastName')),
    __param(3, (0, common_1.Query)('nationalId')),
    __param(4, (0, common_1.Query)('phoneNumber')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], EMRController.prototype, "searchPatients", null);
__decorate([
    (0, common_1.Get)('patients/:id/history'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EMRController.prototype, "getPatientHistory", null);
__decorate([
    (0, common_1.Post)('visits'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EMRController.prototype, "createMedicalVisit", null);
__decorate([
    (0, common_1.Put)('visits/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EMRController.prototype, "updateMedicalVisit", null);
__decorate([
    (0, common_1.Post)('visits/:id/discharge'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EMRController.prototype, "dischargePatient", null);
__decorate([
    (0, common_1.Get)('surge/analytics'),
    __param(0, (0, common_1.Query)('hospitalId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], EMRController.prototype, "getSurgeAnalytics", null);
EMRController = __decorate([
    (0, common_1.Controller)('emr'),
    __metadata("design:paramtypes", [emr_service_1.EMRService])
], EMRController);
exports.EMRController = EMRController;
//# sourceMappingURL=emr.controller.js.map