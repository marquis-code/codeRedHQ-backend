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
        return this.hospitalModel.find(query).exec();
    }
    async findOne(id) {
        const hospital = await this.hospitalModel.findById(id).exec();
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
        }).exec();
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
        return this.hospitalModel.find({
            $nearSphere: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude],
                },
                $maxDistance: maxDistance,
            },
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
};
HospitalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(hospital_schema_1.Hospital.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], HospitalService);
exports.HospitalService = HospitalService;
//# sourceMappingURL=hospital.service.js.map