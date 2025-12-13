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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_service_1 = require("./audit.service");
const mongoose_1 = require("mongoose");
let AuditController = class AuditController {
    constructor(auditService) {
        this.auditService = auditService;
    }
    async createLog(createAuditLogDto) {
        try {
            const log = await this.auditService.createLog(createAuditLogDto);
            return {
                success: true,
                message: 'Audit log created successfully',
                data: log
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to create audit log',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getHospitalLogs(hospitalId, startDate, endDate, action, resourceType, staffId, limit, skip) {
        if (!mongoose_1.Types.ObjectId.isValid(hospitalId)) {
            throw new common_1.BadRequestException('Invalid hospital ID format');
        }
        try {
            const options = {};
            if (startDate) {
                options.startDate = new Date(startDate);
                if (isNaN(options.startDate.getTime())) {
                    throw new common_1.BadRequestException('Invalid start date format');
                }
            }
            if (endDate) {
                options.endDate = new Date(endDate);
                if (isNaN(options.endDate.getTime())) {
                    throw new common_1.BadRequestException('Invalid end date format');
                }
            }
            if (action)
                options.action = action;
            if (resourceType)
                options.resourceType = resourceType;
            if (staffId) {
                if (!mongoose_1.Types.ObjectId.isValid(staffId)) {
                    throw new common_1.BadRequestException('Invalid staff ID format');
                }
                options.staffId = staffId;
            }
            if (limit)
                options.limit = parseInt(limit, 10);
            if (skip)
                options.skip = parseInt(skip, 10);
            const result = await this.auditService.getHospitalLogs(hospitalId, options);
            return {
                success: true,
                message: 'Audit logs retrieved successfully',
                data: {
                    logs: result.logs,
                    total: result.total,
                    limit: options.limit || 50,
                    skip: options.skip || 0,
                    hasMore: result.total > (options.skip || 0) + result.logs.length
                }
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to retrieve audit logs',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getResourceHistory(resourceType, resourceId) {
        if (!mongoose_1.Types.ObjectId.isValid(resourceId)) {
            throw new common_1.BadRequestException('Invalid resource ID format');
        }
        try {
            const logs = await this.auditService.getResourceHistory(resourceType, resourceId);
            return {
                success: true,
                message: 'Resource history retrieved successfully',
                data: {
                    resourceType,
                    resourceId,
                    totalRecords: logs.length,
                    history: logs
                }
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to retrieve resource history',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getStaffActivity(staffId, startDate, endDate) {
        if (!mongoose_1.Types.ObjectId.isValid(staffId)) {
            throw new common_1.BadRequestException('Invalid staff ID format');
        }
        try {
            const startDateObj = startDate ? new Date(startDate) : undefined;
            const endDateObj = endDate ? new Date(endDate) : undefined;
            if (startDateObj && isNaN(startDateObj.getTime())) {
                throw new common_1.BadRequestException('Invalid start date format');
            }
            if (endDateObj && isNaN(endDateObj.getTime())) {
                throw new common_1.BadRequestException('Invalid end date format');
            }
            const logs = await this.auditService.getStaffActivity(staffId, startDateObj, endDateObj);
            return {
                success: true,
                message: 'Staff activity retrieved successfully',
                data: {
                    staffId,
                    totalActivities: logs.length,
                    activities: logs
                }
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to retrieve staff activity',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getActivitySummary(hospitalId, startDate, endDate) {
        if (!mongoose_1.Types.ObjectId.isValid(hospitalId)) {
            throw new common_1.BadRequestException('Invalid hospital ID format');
        }
        if (!startDate || !endDate) {
            throw new common_1.BadRequestException('Both startDate and endDate are required');
        }
        try {
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            if (isNaN(startDateObj.getTime())) {
                throw new common_1.BadRequestException('Invalid start date format');
            }
            if (isNaN(endDateObj.getTime())) {
                throw new common_1.BadRequestException('Invalid end date format');
            }
            if (startDateObj > endDateObj) {
                throw new common_1.BadRequestException('Start date must be before end date');
            }
            const summary = await this.auditService.getActivitySummary(hospitalId, startDateObj, endDateObj);
            return {
                success: true,
                message: 'Activity summary retrieved successfully',
                data: {
                    hospitalId,
                    period: {
                        startDate: startDateObj,
                        endDate: endDateObj
                    },
                    summary
                }
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to retrieve activity summary',
                error: error.message
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create audit log',
        description: 'Manually create an audit log entry'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Audit log created successfully'
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "createLog", null);
__decorate([
    (0, common_1.Get)('hospital/:hospitalId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get hospital audit logs',
        description: 'Retrieve audit logs for a specific hospital with optional filters'
    }),
    (0, swagger_1.ApiParam)({
        name: 'hospitalId',
        description: 'Hospital ID',
        type: String
    }),
    (0, swagger_1.ApiQuery)({
        name: 'startDate',
        required: false,
        type: String,
        description: 'Start date (ISO format)',
        example: '2024-01-01T00:00:00.000Z'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'endDate',
        required: false,
        type: String,
        description: 'End date (ISO format)',
        example: '2024-12-31T23:59:59.999Z'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'action',
        required: false,
        type: String,
        description: 'Filter by action type',
        example: 'bedspace_update'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'resourceType',
        required: false,
        type: String,
        description: 'Filter by resource type',
        example: 'Bedspace'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'staffId',
        required: false,
        type: String,
        description: 'Filter by staff ID'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Number of records to return',
        example: 50
    }),
    (0, swagger_1.ApiQuery)({
        name: 'skip',
        required: false,
        type: Number,
        description: 'Number of records to skip',
        example: 0
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Audit logs retrieved successfully'
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid hospital ID' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('action')),
    __param(4, (0, common_1.Query)('resourceType')),
    __param(5, (0, common_1.Query)('staffId')),
    __param(6, (0, common_1.Query)('limit')),
    __param(7, (0, common_1.Query)('skip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getHospitalLogs", null);
__decorate([
    (0, common_1.Get)('resource/:resourceType/:resourceId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get resource history',
        description: 'Retrieve audit history for a specific resource'
    }),
    (0, swagger_1.ApiParam)({
        name: 'resourceType',
        description: 'Type of resource (e.g., Bedspace, Patient, MedicalVisit)',
        type: String,
        example: 'Bedspace'
    }),
    (0, swagger_1.ApiParam)({
        name: 'resourceId',
        description: 'Resource ID',
        type: String
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Resource history retrieved successfully'
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid resource ID' }),
    __param(0, (0, common_1.Param)('resourceType')),
    __param(1, (0, common_1.Param)('resourceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getResourceHistory", null);
__decorate([
    (0, common_1.Get)('staff/:staffId/activity'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get staff activity',
        description: 'Retrieve audit logs for a specific staff member'
    }),
    (0, swagger_1.ApiParam)({
        name: 'staffId',
        description: 'Staff ID',
        type: String
    }),
    (0, swagger_1.ApiQuery)({
        name: 'startDate',
        required: false,
        type: String,
        description: 'Start date (ISO format)',
        example: '2024-01-01T00:00:00.000Z'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'endDate',
        required: false,
        type: String,
        description: 'End date (ISO format)',
        example: '2024-12-31T23:59:59.999Z'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Staff activity retrieved successfully'
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid staff ID' }),
    __param(0, (0, common_1.Param)('staffId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getStaffActivity", null);
__decorate([
    (0, common_1.Get)('hospital/:hospitalId/summary'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get activity summary',
        description: 'Get aggregated activity summary for a hospital'
    }),
    (0, swagger_1.ApiParam)({
        name: 'hospitalId',
        description: 'Hospital ID',
        type: String
    }),
    (0, swagger_1.ApiQuery)({
        name: 'startDate',
        required: true,
        type: String,
        description: 'Start date (ISO format)',
        example: '2024-01-01T00:00:00.000Z'
    }),
    (0, swagger_1.ApiQuery)({
        name: 'endDate',
        required: true,
        type: String,
        description: 'End date (ISO format)',
        example: '2024-12-31T23:59:59.999Z'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Activity summary retrieved successfully'
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid parameters' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getActivitySummary", null);
AuditController = __decorate([
    (0, swagger_1.ApiTags)('Audit Logs'),
    (0, common_1.Controller)('audit'),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
exports.AuditController = AuditController;
//# sourceMappingURL=audit.controller.js.map