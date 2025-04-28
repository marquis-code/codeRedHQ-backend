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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const uuid_1 = require("uuid");
const event_emitter_1 = require("@nestjs/event-emitter");
const hospital_schema_1 = require("./schemas/hospital.schema");
let HospitalService = class HospitalService {
    constructor(hospitalModel, eventEmitter) {
        this.hospitalModel = hospitalModel;
        this.eventEmitter = eventEmitter;
    }
    async create(createHospitalDto) {
        const existingHospital = await this.hospitalModel.findOne({
            hospitalName: createHospitalDto.hospitalName
        }).exec();
        if (existingHospital) {
            throw new common_1.ConflictException('Hospital with this name already exists');
        }
        if (!createHospitalDto.uuid) {
            createHospitalDto.uuid = (0, uuid_1.v4)();
        }
        const createdHospital = new this.hospitalModel(createHospitalDto);
        const savedHospital = await createdHospital.save();
        this.eventEmitter.emit('hospital.created', {
            hospitalId: savedHospital._id,
            hospitalName: savedHospital.hospitalName,
        });
        return savedHospital;
    }
    async findAll(query = {}) {
        const { page = 1, limit = 10 } = query, filters = __rest(query, ["page", "limit"]);
        const filterObj = { isActive: true };
        if (filters.facilityType) {
            filterObj.facilityType = filters.facilityType;
        }
        if (filters.emergencyServices) {
            filterObj.emergencyServices = filters.emergencyServices;
        }
        if (filters.specialties) {
            filterObj.availableSpecialties = { $in: filters.specialties.split(',') };
        }
        const skip = (page - 1) * limit;
        return this.hospitalModel
            .find(filterObj)
            .select('-password')
            .skip(Number(skip))
            .limit(Number(limit))
            .exec();
    }
    async findOne(id) {
        let hospital;
        if ((0, mongoose_2.isValidObjectId)(id)) {
            hospital = await this.hospitalModel.findById(id).select('-password').exec();
        }
        else {
            hospital = await this.hospitalModel.findOne({ uuid: id }).select('-password').exec();
        }
        if (!hospital) {
            throw new common_1.NotFoundException(`Hospital with ID ${id} not found`);
        }
        return hospital;
    }
    async update(id, updateHospitalDto) {
        const hospital = await this.findOne(id);
        const updatedHospital = await this.hospitalModel
            .findByIdAndUpdate(hospital._id, { $set: updateHospitalDto }, { new: true })
            .select('-password')
            .exec();
        if (!updatedHospital) {
            throw new common_1.NotFoundException(`Hospital with ID ${id} not found after update attempt`);
        }
        this.eventEmitter.emit('hospital.updated', {
            hospitalId: updatedHospital._id,
            hospitalName: updatedHospital.hospitalName,
        });
        return updatedHospital;
    }
    async remove(id) {
        const hospital = await this.findOne(id);
        await this.hospitalModel.findByIdAndUpdate(hospital._id, { isActive: false }).exec();
        this.eventEmitter.emit('hospital.removed', {
            hospitalId: hospital._id,
            hospitalName: hospital.hospitalName,
        });
    }
    async findNearby(latitude, longitude, maxDistance = 10000) {
        if (!latitude || !longitude) {
            throw new common_1.BadRequestException('Latitude and longitude are required');
        }
        return this.hospitalModel.find({
            isActive: true,
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    $maxDistance: maxDistance,
                },
            },
        })
            .select('-password')
            .exec();
    }
};
HospitalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(hospital_schema_1.Hospital.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        event_emitter_1.EventEmitter2])
], HospitalService);
exports.HospitalService = HospitalService;
//# sourceMappingURL=hospital.service.js.map