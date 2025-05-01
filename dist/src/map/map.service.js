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
exports.MapService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const hospital_schema_1 = require("../hospital/schemas/hospital.schema");
const bedspace_schema_1 = require("../bedspace/schemas/bedspace.schema");
let MapService = class MapService {
    constructor(hospitalModel, bedspaceModel) {
        this.hospitalModel = hospitalModel;
        this.bedspaceModel = bedspaceModel;
    }
    async getNearbyHospitals(latitude, longitude, radius = 10000) {
        if (!latitude || !longitude) {
            throw new common_1.BadRequestException('Latitude and longitude are required');
        }
        const hospitals = await this.hospitalModel.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    distanceField: 'distance',
                    maxDistance: radius,
                    spherical: true,
                    query: { isActive: true }
                }
            },
            {
                $project: {
                    _id: 1,
                    uuid: 1,
                    hospitalName: 1,
                    address: 1,
                    facilityType: 1,
                    emergencyServices: 1,
                    latitude: 1,
                    longitude: 1,
                    distance: 1
                }
            }
        ]).exec();
        const hospitalsWithBedspace = await Promise.all(hospitals.map(async (hospital) => {
            const bedspaceSummary = await this.bedspaceModel.aggregate([
                { $match: { hospital: hospital._id } },
                { $group: {
                        _id: null,
                        totalBeds: { $sum: '$totalBeds' },
                        availableBeds: { $sum: '$availableBeds' },
                        occupiedBeds: { $sum: '$occupiedBeds' }
                    }
                }
            ]).exec();
            const bedspace = bedspaceSummary.length > 0 ? bedspaceSummary[0] : {
                totalBeds: 0,
                availableBeds: 0,
                occupiedBeds: 0
            };
            let status = 'unavailable';
            if (bedspace.availableBeds > 0) {
                const occupancyRate = (bedspace.occupiedBeds / bedspace.totalBeds) * 100;
                status = occupancyRate >= 80 ? 'limited' : 'available';
            }
            return Object.assign(Object.assign({}, hospital), { bedspace: {
                    total: bedspace.totalBeds,
                    available: bedspace.availableBeds,
                    occupied: bedspace.occupiedBeds
                }, status });
        }));
        return hospitalsWithBedspace;
    }
    async getEmergencySurgePoints() {
        const surgePoints = await this.bedspaceModel.aggregate([
            {
                $group: {
                    _id: '$hospital',
                    totalBeds: { $sum: '$totalBeds' },
                    availableBeds: { $sum: '$availableBeds' },
                    occupiedBeds: { $sum: '$occupiedBeds' }
                }
            },
            {
                $match: {
                    $expr: {
                        $gte: [
                            { $divide: ['$occupiedBeds', '$totalBeds'] },
                            0.8
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: 'hospitals',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'hospital'
                }
            },
            {
                $unwind: '$hospital'
            },
            {
                $project: {
                    _id: 0,
                    hospitalId: '$_id',
                    hospitalName: '$hospital.hospitalName',
                    address: '$hospital.address',
                    latitude: '$hospital.latitude',
                    longitude: '$hospital.longitude',
                    occupancyRate: {
                        $multiply: [
                            { $divide: ['$occupiedBeds', '$totalBeds'] },
                            100
                        ]
                    },
                    totalBeds: 1,
                    availableBeds: 1,
                    occupiedBeds: 1
                }
            }
        ]).exec();
        return surgePoints;
    }
    async getHospitalDensityHeatmap() {
        const heatmapData = await this.hospitalModel.aggregate([
            {
                $match: { isActive: true }
            },
            {
                $lookup: {
                    from: 'bedspaces',
                    localField: '_id',
                    foreignField: 'hospital',
                    as: 'bedspaces'
                }
            },
            {
                $addFields: {
                    totalBeds: { $sum: '$bedspaces.totalBeds' },
                    availableBeds: { $sum: '$bedspaces.availableBeds' },
                    occupiedBeds: { $sum: '$bedspaces.occupiedBeds' }
                }
            },
            {
                $project: {
                    _id: 0,
                    location: {
                        lat: '$latitude',
                        lng: '$longitude'
                    },
                    weight: {
                        $cond: {
                            if: { $eq: ['$totalBeds', 0] },
                            then: 1,
                            else: {
                                $subtract: [
                                    1,
                                    { $divide: ['$availableBeds', '$totalBeds'] }
                                ]
                            }
                        }
                    },
                    hospitalName: 1,
                    totalBeds: 1,
                    availableBeds: 1,
                    occupiedBeds: 1
                }
            }
        ]).exec();
        return heatmapData;
    }
};
MapService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(hospital_schema_1.Hospital.name)),
    __param(1, (0, mongoose_1.InjectModel)(bedspace_schema_1.Bedspace.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], MapService);
exports.MapService = MapService;
//# sourceMappingURL=map.service.js.map