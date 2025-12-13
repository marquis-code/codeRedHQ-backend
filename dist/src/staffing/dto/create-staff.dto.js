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
exports.StaffUpdateBedspaceDto = exports.UpdateStaffDto = exports.CreateStaffDto = exports.ClockOutDto = exports.ClockInDto = exports.LoginStaffDto = exports.RegisterStaffDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const mongoose_1 = require("mongoose");
class ScheduleItemDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Date)
], ScheduleItemDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleItemDto.prototype, "shift", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleItemDto.prototype, "status", void 0);
class RegisterStaffDto {
}
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], RegisterStaffDto.prototype, "hospital", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterStaffDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterStaffDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], RegisterStaffDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterStaffDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterStaffDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterStaffDto.prototype, "contactNumber", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], RegisterStaffDto.prototype, "specializations", void 0);
exports.RegisterStaffDto = RegisterStaffDto;
class LoginStaffDto {
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginStaffDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginStaffDto.prototype, "password", void 0);
exports.LoginStaffDto = LoginStaffDto;
class ClockInDto {
}
__decorate([
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], ClockInDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], ClockInDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['morning', 'afternoon', 'night', 'emergency']),
    __metadata("design:type", String)
], ClockInDto.prototype, "shift", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ClockInDto.prototype, "notes", void 0);
exports.ClockInDto = ClockInDto;
class ClockOutDto {
}
__decorate([
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], ClockOutDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], ClockOutDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ClockOutDto.prototype, "notes", void 0);
exports.ClockOutDto = ClockOutDto;
class CreateStaffDto {
    constructor() {
        this.availability = 'Off Shift';
        this.emrAccessLevel = 'none';
        this.isActive = true;
        this.isVerified = false;
    }
}
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", mongoose_1.Types.ObjectId)
], CreateStaffDto.prototype, "hospital", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['Available', 'Unavailable', 'On Shift', 'Off Shift']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "availability", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "contactNumber", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ScheduleItemDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateStaffDto.prototype, "schedule", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateStaffDto.prototype, "specializations", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateStaffDto.prototype, "permissions", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['none', 'read', 'write', 'admin']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "emrAccessLevel", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateStaffDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateStaffDto.prototype, "isVerified", void 0);
exports.CreateStaffDto = CreateStaffDto;
class UpdateStaffDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "contactNumber", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateStaffDto.prototype, "specializations", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateStaffDto.prototype, "permissions", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['none', 'read', 'write', 'admin']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "emrAccessLevel", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateStaffDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateStaffDto.prototype, "isVerified", void 0);
exports.UpdateStaffDto = UpdateStaffDto;
class StaffUpdateBedspaceDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], StaffUpdateBedspaceDto.prototype, "availableBeds", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], StaffUpdateBedspaceDto.prototype, "occupiedBeds", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StaffUpdateBedspaceDto.prototype, "notes", void 0);
exports.StaffUpdateBedspaceDto = StaffUpdateBedspaceDto;
//# sourceMappingURL=create-staff.dto.js.map