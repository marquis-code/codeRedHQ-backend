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
exports.BedspaceController = void 0;
const common_1 = require("@nestjs/common");
const bedspace_service_1 = require("./bedspace.service");
const create_bedspace_dto_1 = require("./dto/create-bedspace.dto");
const update_bedspace_dto_1 = require("./dto/update-bedspace.dto");
let BedspaceController = class BedspaceController {
    constructor(bedspaceService) {
        this.bedspaceService = bedspaceService;
    }
    async create(createBedspaceDto) {
        return this.bedspaceService.create(createBedspaceDto);
    }
    async findAll(hospitalId) {
        return this.bedspaceService.findAllBedspaces(hospitalId);
    }
    async findOne(id) {
        return this.bedspaceService.findOne(id);
    }
    async update(id, updateBedspaceDto) {
        return this.bedspaceService.update(id, updateBedspaceDto);
    }
    async remove(id) {
        return this.bedspaceService.remove(id);
    }
    async getHospitalSummary(hospitalId) {
        return this.bedspaceService.getHospitalSummary(hospitalId);
    }
    async updateBedAvailability(id, action) {
        const isDischarge = action === 'discharge';
        return this.bedspaceService.updateBedAvailability(id, isDischarge);
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_bedspace_dto_1.CreateBedspaceDto]),
    __metadata("design:returntype", Promise)
], BedspaceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('hospitalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BedspaceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BedspaceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_bedspace_dto_1.UpdateBedspaceDto]),
    __metadata("design:returntype", Promise)
], BedspaceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BedspaceController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('hospital/:hospitalId/summary'),
    __param(0, (0, common_1.Param)('hospitalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BedspaceController.prototype, "getHospitalSummary", null);
__decorate([
    (0, common_1.Put)(':id/availability'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BedspaceController.prototype, "updateBedAvailability", null);
BedspaceController = __decorate([
    (0, common_1.Controller)('bedspaces'),
    __metadata("design:paramtypes", [bedspace_service_1.BedspaceService])
], BedspaceController);
exports.BedspaceController = BedspaceController;
//# sourceMappingURL=bedspace.controller.js.map