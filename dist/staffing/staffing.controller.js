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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffingController = void 0;
const common_1 = require("@nestjs/common");
const staffing_service_1 = require("./staffing.service");
const create_staff_dto_1 = require("./dto/create-staff.dto");
const update_staff_dto_1 = require("./dto/update-staff.dto");
let StaffingController = class StaffingController {
    constructor(staffingService) {
        this.staffingService = staffingService;
    }
    async create(createStaffDto) {
        return this.staffingService.create(createStaffDto);
    }
    async findAll(hospitalId, department, availability) {
        return this.staffingService.findAll(hospitalId, department, availability);
    }
    async findOne(id) {
        return this.staffingService.findOne(id);
    }
    async update(id, updateStaffDto) {
        return this.staffingService.update(id, updateStaffDto);
    }
    async remove(id) {
        return this.staffingService.remove(id);
    }
    async updateAvailability(id, availability) {
        return this.staffingService.updateAvailability(id, availability);
    }
    async getStaffSummary(hospitalId) {
        return this.staffingService.getStaffSummary(hospitalId);
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof create_staff_dto_1.CreateStaffDto !== "undefined" && create_staff_dto_1.CreateStaffDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('hospitalId')),
    __param(1, (0, common_1.Query)('department')),
    __param(2, (0, common_1.Query)('availability')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof update_staff_dto_1.UpdateStaffDto !== "undefined" && update_staff_dto_1.UpdateStaffDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/availability'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('availability')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "updateAvailability", null);
__decorate([
    (0, common_1.Get)('hospital/:hospitalId/summary'),
    __param(0, (0, common_1.Param)('hospitalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "getStaffSummary", null);
StaffingController = __decorate([
    (0, common_1.Controller)('staff'),
    __metadata("design:paramtypes", [staffing_service_1.StaffingService])
], StaffingController);
exports.StaffingController = StaffingController;
//# sourceMappingURL=staffing.controller.js.map