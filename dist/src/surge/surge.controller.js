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
exports.SurgeController = void 0;
const common_1 = require("@nestjs/common");
const surge_service_1 = require("./surge.service");
let SurgeController = class SurgeController {
    constructor(surgeService) {
        this.surgeService = surgeService;
    }
    async createSurge(createSurgeDto) {
        return this.surgeService.createSurge(createSurgeDto);
    }
    async updateSurgeStatus(id, updateDto) {
        return this.surgeService.updateSurgeStatus(id, updateDto.status, updateDto.metadata);
    }
    async getSurgesByHospital(hospitalId, status) {
        const statusArray = status ? status.split(',') : undefined;
        return this.surgeService.getSurgesByHospital(hospitalId, statusArray);
    }
    async getSurgesInRegion(latitude, longitude, radius, status) {
        const statusArray = status ? status.split(',') : undefined;
        return this.surgeService.getSurgesInRegion(latitude, longitude, radius, statusArray);
    }
    async getSurgeById(id) {
        return this.surgeService.getSurgeById(id);
    }
};
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SurgeController.prototype, "createSurge", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SurgeController.prototype, "updateSurgeStatus", null);
__decorate([
    (0, common_1.Get)('hospital/:hospitalId'),
    __param(0, (0, common_1.Param)('hospitalId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SurgeController.prototype, "getSurgesByHospital", null);
__decorate([
    (0, common_1.Get)('region'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('radius')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String]),
    __metadata("design:returntype", Promise)
], SurgeController.prototype, "getSurgesInRegion", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SurgeController.prototype, "getSurgeById", null);
SurgeController = __decorate([
    (0, common_1.Controller)('surges'),
    __metadata("design:paramtypes", [surge_service_1.SurgeService])
], SurgeController);
exports.SurgeController = SurgeController;
//# sourceMappingURL=surge.controller.js.map