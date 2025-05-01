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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getBedOccupancyTrends(hospitalId, startDateStr, endDateStr) {
        try {
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new common_1.BadRequestException('Invalid date format. Please use YYYY-MM-DD');
            }
            return this.reportsService.getBedOccupancyTrends(hospitalId, startDate, endDate);
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Invalid date format. Please use YYYY-MM-DD');
        }
    }
    async getEmergencyAlertsTrends(hospitalId, startDateStr, endDateStr) {
        try {
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new common_1.BadRequestException('Invalid date format. Please use YYYY-MM-DD');
            }
            return this.reportsService.getEmergencyAlertsTrends(hospitalId, startDate, endDate);
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Invalid date format. Please use YYYY-MM-DD');
        }
    }
    async getStaffAvailabilityTrends(hospitalId, startDateStr, endDateStr) {
        try {
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new common_1.BadRequestException('Invalid date format. Please use YYYY-MM-DD');
            }
            return this.reportsService.getStaffAvailabilityTrends(hospitalId, startDate, endDate);
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Invalid date format. Please use YYYY-MM-DD');
        }
    }
    async getDashboardSummary(hospitalId) {
        return this.reportsService.getDashboardSummary(hospitalId);
    }
};
__decorate([
    (0, common_1.Get)('bed-occupancy/:hospitalId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get bed occupancy trends for a hospital' }),
    (0, swagger_1.ApiParam)({ name: 'hospitalId', description: 'Hospital ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, type: String, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, type: String, description: 'End date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns bed occupancy trends' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getBedOccupancyTrends", null);
__decorate([
    (0, common_1.Get)('emergency-alerts/:hospitalId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get emergency alerts trends for a hospital' }),
    (0, swagger_1.ApiParam)({ name: 'hospitalId', description: 'Hospital ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, type: String, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, type: String, description: 'End date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns emergency alerts trends' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getEmergencyAlertsTrends", null);
__decorate([
    (0, common_1.Get)('staff-availability/:hospitalId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get staff availability trends for a hospital' }),
    (0, swagger_1.ApiParam)({ name: 'hospitalId', description: 'Hospital ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, type: String, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, type: String, description: 'End date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns staff availability trends' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getStaffAvailabilityTrends", null);
__decorate([
    (0, common_1.Get)('dashboard-summary/:hospitalId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard summary for a hospital' }),
    (0, swagger_1.ApiParam)({ name: 'hospitalId', description: 'Hospital ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns dashboard summary' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getDashboardSummary", null);
ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
exports.ReportsController = ReportsController;
//# sourceMappingURL=reports.controller.js.map