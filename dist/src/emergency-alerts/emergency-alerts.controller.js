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
exports.EmergencyAlertsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const emergency_alerts_service_1 = require("./emergency-alerts.service");
const create_emergency_alert_dto_1 = require("./dto/create-emergency-alert.dto");
const update_emergency_alert_dto_1 = require("./dto/update-emergency-alert.dto");
let EmergencyAlertsController = class EmergencyAlertsController {
    constructor(emergencyAlertsService) {
        this.emergencyAlertsService = emergencyAlertsService;
    }
    async create(createEmergencyAlertDto) {
        return this.emergencyAlertsService.create(createEmergencyAlertDto);
    }
    async findAll(hospitalId, status) {
        return this.emergencyAlertsService.findAll(hospitalId, status);
    }
    async findOne(id) {
        return this.emergencyAlertsService.findOne(id);
    }
    async update(id, updateEmergencyAlertDto) {
        return this.emergencyAlertsService.update(id, updateEmergencyAlertDto);
    }
    async remove(id) {
        return this.emergencyAlertsService.remove(id);
    }
    async resolveAlert(id, resolvedBy) {
        return this.emergencyAlertsService.resolveAlert(id, resolvedBy);
    }
    async getActiveAlertCount(hospitalId) {
        const count = await this.emergencyAlertsService.getActiveAlertCount(hospitalId);
        return { count };
    }
    async getAlertsByType(hospitalId, startDateStr, endDateStr) {
        const startDate = startDateStr ? new Date(startDateStr) : null;
        const endDate = endDateStr ? new Date(endDateStr) : null;
        return this.emergencyAlertsService.getAlertsByType(hospitalId, startDate, endDate);
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new emergency alert' }),
    (0, swagger_1.ApiBody)({ type: create_emergency_alert_dto_1.CreateEmergencyAlertDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'The emergency alert has been successfully created.' }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_emergency_alert_dto_1.CreateEmergencyAlertDto]),
    __metadata("design:returntype", Promise)
], EmergencyAlertsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all emergency alerts' }),
    (0, swagger_1.ApiQuery)({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status (Active, Resolved, Expired)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns all emergency alerts based on filters.' }),
    __param(0, (0, common_1.Query)('hospitalId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EmergencyAlertsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get emergency alert by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Emergency Alert ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns the emergency alert.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Emergency alert not found.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmergencyAlertsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update emergency alert' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Emergency Alert ID' }),
    (0, swagger_1.ApiBody)({ type: update_emergency_alert_dto_1.UpdateEmergencyAlertDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The emergency alert has been successfully updated.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Emergency alert not found.' }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_emergency_alert_dto_1.UpdateEmergencyAlertDto]),
    __metadata("design:returntype", Promise)
], EmergencyAlertsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete emergency alert' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Emergency Alert ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The emergency alert has been successfully deleted.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Emergency alert not found.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmergencyAlertsController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/resolve'),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve emergency alert' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Emergency Alert ID' }),
    (0, swagger_1.ApiQuery)({ name: 'resolvedBy', required: true, description: 'ID or name of person resolving the alert' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'The emergency alert has been successfully resolved.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Alert is already resolved.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Emergency alert not found.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('resolvedBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EmergencyAlertsController.prototype, "resolveAlert", null);
__decorate([
    (0, common_1.Get)('/count/:hospitalId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get count of active alerts for a hospital' }),
    (0, swagger_1.ApiParam)({ name: 'hospitalId', description: 'Hospital ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns count of active alerts.' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmergencyAlertsController.prototype, "getActiveAlertCount", null);
__decorate([
    (0, common_1.Get)('/by-type/:hospitalId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get alerts grouped by type for a hospital' }),
    (0, swagger_1.ApiParam)({ name: 'hospitalId', description: 'Hospital ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Filter by start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'Filter by end date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns alerts grouped by type.' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], EmergencyAlertsController.prototype, "getAlertsByType", null);
EmergencyAlertsController = __decorate([
    (0, swagger_1.ApiTags)('emergency-alerts'),
    (0, common_1.Controller)('emergency-alerts'),
    __metadata("design:paramtypes", [emergency_alerts_service_1.EmergencyAlertsService])
], EmergencyAlertsController);
exports.EmergencyAlertsController = EmergencyAlertsController;
//# sourceMappingURL=emergency-alerts.controller.js.map