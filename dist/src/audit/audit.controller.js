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
const jwt_auth_gaurd_1 = require("../auth/jwt-auth.gaurd");
const audit_service_1 = require("./audit.service");
const swagger_1 = require("@nestjs/swagger");
let AuditController = class AuditController {
    constructor(auditService) {
        this.auditService = auditService;
    }
    findAll(hospitalId, query) {
        return this.auditService.findAll(hospitalId, query);
    }
    getActivitySummary(hospitalId, days) {
        return this.auditService.getActivitySummary(hospitalId, days);
    }
    findOne(id) {
        return this.auditService.findOne(id);
    }
};
__decorate([
    (0, common_1.Get)(':hospitalId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit logs for a hospital' }),
    (0, swagger_1.ApiParam)({ name: 'hospitalId', description: 'Hospital ID' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'module', required: false, description: 'Filter by module' }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false, description: 'Filter by action' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (ISO format)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (ISO format)' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':hospitalId/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit activity summary for a hospital' }),
    (0, swagger_1.ApiParam)({ name: 'hospitalId', description: 'Hospital ID' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, description: 'Number of days to include in summary' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getActivitySummary", null);
__decorate([
    (0, common_1.Get)('detail/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit log detail' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Audit log ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "findOne", null);
AuditController = __decorate([
    (0, swagger_1.ApiTags)('audit'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_gaurd_1.JwtAuthGuard),
    (0, common_1.Controller)('audit'),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
exports.AuditController = AuditController;
//# sourceMappingURL=audit.controller.js.map