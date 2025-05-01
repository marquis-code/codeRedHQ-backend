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
exports.UpdateEmergencyAlertDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class UpdateEmergencyAlertDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Alert title' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmergencyAlertDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Alert description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmergencyAlertDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Alert severity', enum: ['High', 'Moderate', 'Low'] }),
    (0, class_validator_1.IsEnum)(['High', 'Moderate', 'Low']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmergencyAlertDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Alert end time' }),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateEmergencyAlertDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Alert status', enum: ['Active', 'Resolved', 'Expired'] }),
    (0, class_validator_1.IsEnum)(['Active', 'Resolved', 'Expired']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmergencyAlertDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Affected department' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmergencyAlertDto.prototype, "affectedDepartment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'List of actions taken' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateEmergencyAlertDto.prototype, "actions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Resolved by (user ID or name)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEmergencyAlertDto.prototype, "resolvedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Time when the alert was resolved' }),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateEmergencyAlertDto.prototype, "resolvedAt", void 0);
exports.UpdateEmergencyAlertDto = UpdateEmergencyAlertDto;
//# sourceMappingURL=update-emergency-alert.dto.js.map