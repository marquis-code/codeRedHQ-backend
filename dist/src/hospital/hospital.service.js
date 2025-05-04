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
exports.HospitalService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const hospital_schema_1 = require("./schemas/hospital.schema");
let HospitalService = class HospitalService {
    constructor(hospitalModel) {
        this.hospitalModel = hospitalModel;
    }
    async create(createHospitalDto) {
        const existingEmail = await this.hospitalModel.findOne({ email: createHospitalDto.email }).exec();
        if (existingEmail) {
            throw new common_1.ConflictException('Email already exists');
        }
        const username = await this.generateUniqueUsername(createHospitalDto.hospitalName, createHospitalDto.address);
        const newHospital = new this.hospitalModel(Object.assign(Object.assign({}, createHospitalDto), { username }));
        return newHospital.save();
    }
    async findAll(query) {
        return this.hospitalModel.find(query).populate('bedspaces').exec();
    }
    async findOne(id) {
        const hospital = await this.hospitalModel.findById(id).populate('bedspaces').exec();
        if (!hospital) {
            throw new common_1.NotFoundException(`Hospital with ID ${id} not found`);
        }
        return hospital;
    }
    async findByUsernameOrEmail(usernameOrEmail) {
        const hospital = await this.hospitalModel.findOne({
            $or: [
                { username: usernameOrEmail },
                { email: usernameOrEmail }
            ]
        }).populate('bedspaces').exec();
        if (!hospital) {
            throw new common_1.NotFoundException(`Hospital not found`);
        }
        return hospital;
    }
    async update(id, updateHospitalDto) {
        const hospital = await this.hospitalModel
            .findByIdAndUpdate(id, updateHospitalDto, { new: true })
            .exec();
        if (!hospital) {
            throw new common_1.NotFoundException(`Hospital with ID ${id} not found`);
        }
        return hospital;
    }
    async remove(id) {
        const result = await this.hospitalModel.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException(`Hospital with ID ${id} not found`);
        }
    }
    async findNearby(latitude, longitude, maxDistance = 10000) {
        try {
            const lat = Number(latitude);
            const lng = Number(longitude);
            if (isNaN(lat) || isNaN(lng)) {
                throw new Error('Invalid coordinates: latitude and longitude must be numbers');
            }
            console.log(`Searching for hospitals near [${lng}, ${lat}] with max distance ${maxDistance}m`);
            const hospitals = await this.hospitalModel.find({
                location: {
                    $nearSphere: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [lng, lat],
                        },
                        $maxDistance: maxDistance,
                    },
                },
            }).populate('bedspaces').exec();
            console.log(`Found ${hospitals.length} hospitals within ${maxDistance}m`);
            return hospitals;
        }
        catch (error) {
            console.error('Error in findNearby:', error);
            throw error;
        }
    }
    async findNearbyAggregation(latitude, longitude, maxDistance = 10000) {
        try {
            const lat = Number(latitude);
            const lng = Number(longitude);
            if (isNaN(lat) || isNaN(lng)) {
                throw new Error('Invalid coordinates: latitude and longitude must be numbers');
            }
            const hospitals = await this.hospitalModel.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: [lng, lat]
                        },
                        distanceField: 'distance',
                        maxDistance: maxDistance,
                        spherical: true,
                    }
                },
                {
                    $sort: { distance: 1 }
                }
            ]).exec();
            console.log(`Found ${hospitals.length} hospitals within ${maxDistance}m using aggregation`);
            return hospitals;
        }
        catch (error) {
            console.error('Error in findNearbyAggregation:', error);
            throw error;
        }
    }
    async verifyLocationIndex(hospitalId) {
        try {
            const hospital = await this.hospitalModel.findById(hospitalId).exec();
            if (!hospital) {
                return { error: 'Hospital not found' };
            }
            return {
                hospital_id: hospital._id,
                location: hospital.location,
                latitude: hospital.latitude,
                longitude: hospital.longitude,
                indexes: await this.hospitalModel.collection.getIndexes(),
            };
        }
        catch (error) {
            console.error('Error verifying location index:', error);
            throw error;
        }
    }
    async findByExactCoordinates(latitude, longitude) {
        return this.hospitalModel.find({
            latitude: latitude,
            longitude: longitude
        }).exec();
    }
    async generateUniqueUsername(hospitalName, address) {
        const addressParts = address.split(',');
        const locationPart = addressParts.length > 1
            ? addressParts[addressParts.length - 2].trim()
            : addressParts[0].trim();
        let baseUsername = `${hospitalName}_${locationPart}`
            .toLowerCase()
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, '_');
        let username = baseUsername;
        let counter = 1;
        while (await this.hospitalModel.findOne({ username }).exec()) {
            username = `${baseUsername}_${counter}`;
            counter++;
        }
        return username;
    }
    async validateHospital(usernameOrEmail, password) {
        try {
            const hospital = await this.hospitalModel.findOne({
                $or: [
                    { username: usernameOrEmail },
                    { email: usernameOrEmail }
                ]
            }).exec();
            if (!hospital) {
                return null;
            }
            const isPasswordValid = await hospital.comparePassword(password);
            if (!isPasswordValid) {
                return null;
            }
            return hospital;
        }
        catch (error) {
            return null;
        }
    }
    async updateHospitalBedspaceSummary(hospitalId) {
        const hospital = await this.hospitalModel.findById(hospitalId);
        if (!hospital) {
            throw new common_1.NotFoundException(`Hospital with ID ${hospitalId} not found`);
        }
        await hospital.updateBedspaceSummary();
        return hospital;
    }
};
HospitalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(hospital_schema_1.Hospital.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], HospitalService);
exports.HospitalService = HospitalService;
//# sourceMappingURL=hospital.service.js.map