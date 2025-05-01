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
var SurgeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurgeService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const event_emitter_1 = require("@nestjs/event-emitter");
const surge_schema_1 = require("./schema/surge.schema");
const hospital_schema_1 = require("../hospital/schemas/hospital.schema");
let SurgeService = SurgeService_1 = class SurgeService {
    constructor(surgeModel, hospitalModel, eventEmitter) {
        this.surgeModel = surgeModel;
        this.hospitalModel = hospitalModel;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(SurgeService_1.name);
    }
    async createSurge(createSurgeDto) {
        const { hospitalId } = createSurgeDto, surgeData = __rest(createSurgeDto, ["hospitalId"]);
        const hospital = await this.hospitalModel.findById(hospitalId);
        if (!hospital) {
            throw new Error(`Hospital with ID ${hospitalId} not found`);
        }
        const newSurge = new this.surgeModel(Object.assign(Object.assign({}, surgeData), { hospital: hospitalId, status: 'pending' }));
        const savedSurge = await newSurge.save();
        this.eventEmitter.emit('surge.created', {
            hospitalId,
            surge: savedSurge.toObject(),
        });
        return savedSurge;
    }
    async updateSurgeStatus(surgeId, status, metadata) {
        const surge = await this.surgeModel.findById(surgeId);
        if (!surge) {
            throw new Error(`Surge with ID ${surgeId} not found`);
        }
        surge.status = status;
        if (metadata) {
            surge.metadata = Object.assign(Object.assign({}, surge.metadata), metadata);
        }
        const updatedSurge = await surge.save();
        this.eventEmitter.emit('surge.updated', {
            hospitalId: surge.hospital,
            surge: updatedSurge.toObject(),
        });
        return updatedSurge;
    }
    async getSurgesByHospital(hospitalId, status) {
        const query = { hospital: hospitalId };
        if (status && status.length > 0) {
            query.status = { $in: status };
        }
        return this.surgeModel.find(query).exec();
    }
    async getSurgeById(surgeId) {
        return this.surgeModel.findById(surgeId).exec();
    }
    async getSurgesInRegion(latitude, longitude, radiusInKm, status) {
        const radiusInRadians = radiusInKm / 6371;
        const hospitals = await this.hospitalModel.find({
            location: {
                $geoWithin: {
                    $centerSphere: [[longitude, latitude], radiusInRadians],
                },
            },
        }).exec();
        const hospitalIds = hospitals.map(h => h._id);
        const query = { hospital: { $in: hospitalIds } };
        if (status && status.length > 0) {
            query.status = { $in: status };
        }
        return this.surgeModel.find(query).exec();
    }
};
SurgeService = SurgeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(surge_schema_1.Surge.name)),
    __param(1, (0, mongoose_1.InjectModel)(hospital_schema_1.Hospital.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        event_emitter_1.EventEmitter2])
], SurgeService);
exports.SurgeService = SurgeService;
//# sourceMappingURL=surge.service.js.map