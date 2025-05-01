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
exports.CreateAuditLogDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const mongoose_1 = require("mongoose");
class CreateAuditLogDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Hospital ID' }),
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], CreateAuditLogDto.prototype, "hospital", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Module name (e.g., bedspace, staff, emergency)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAuditLogDto.prototype, "module", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Action performed (e.g., create, update, delete)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAuditLogDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the affected resource' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateAuditLogDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Previous state of the resource' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateAuditLogDto.prototype, "previousState", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'New state of the resource' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateAuditLogDto.prototype, "newState", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'IP address of the user' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAuditLogDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User agent of the client' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAuditLogDto.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User who performed the action' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAuditLogDto.prototype, "performedBy", void 0);
exports.CreateAuditLogDto = CreateAuditLogDto;
//# sourceMappingURL=create-audit-log.dto.js.map