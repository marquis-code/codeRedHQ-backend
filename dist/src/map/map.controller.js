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
exports.MapController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const map_service_1 = require("./map.service");
let MapController = class MapController {
    constructor(mapService) {
        this.mapService = mapService;
    }
    async getNearbyHospitals(latitude, longitude, radius) {
        return this.mapService.getNearbyHospitals(latitude, longitude, radius);
    }
    async getEmergencySurgePoints() {
        return this.mapService.getEmergencySurgePoints();
    }
    async getHospitalDensityHeatmap() {
        return this.mapService.getHospitalDensityHeatmap();
    }
};
__decorate([
    (0, common_1.Get)('nearby-hospitals'),
    (0, swagger_1.ApiOperation)({ summary: 'Get nearby hospitals based on location' }),
    (0, swagger_1.ApiQuery)({ name: 'latitude', required: true, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'longitude', required: true, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'radius', required: false, type: Number, description: 'Search radius in meters, defaults to 10000' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns nearby hospitals with bed availability information' }),
    __param(0, (0, common_1.Query)('latitude', common_1.ParseFloatPipe)),
    __param(1, (0, common_1.Query)('longitude', common_1.ParseFloatPipe)),
    __param(2, (0, common_1.Query)('radius', new common_1.DefaultValuePipe(10000), common_1.ParseFloatPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], MapController.prototype, "getNearbyHospitals", null);
__decorate([
    (0, common_1.Get)('emergency-surge-points'),
    (0, swagger_1.ApiOperation)({ summary: 'Get emergency surge points (hospitals with high occupancy)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns hospitals with high bed occupancy rates' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MapController.prototype, "getEmergencySurgePoints", null);
__decorate([
    (0, common_1.Get)('hospital-density-heatmap'),
    (0, swagger_1.ApiOperation)({ summary: 'Get hospital density heatmap data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns heatmap data based on hospital density and bed availability' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MapController.prototype, "getHospitalDensityHeatmap", null);
MapController = __decorate([
    (0, swagger_1.ApiTags)('maps'),
    (0, common_1.Controller)('maps'),
    __metadata("design:paramtypes", [map_service_1.MapService])
], MapController);
exports.MapController = MapController;
//# sourceMappingURL=map.controller.js.map