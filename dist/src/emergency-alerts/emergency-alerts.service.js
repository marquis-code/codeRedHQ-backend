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
exports.EmergencyAlertsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const event_emitter_1 = require("@nestjs/event-emitter");
const emergency_alerts_schema_1 = require("./schemas/emergency-alerts.schema");
let EmergencyAlertsService = class EmergencyAlertsService {
    constructor(emergencyAlertModel, eventEmitter) {
        this.emergencyAlertModel = emergencyAlertModel;
        this.eventEmitter = eventEmitter;
    }
    async create(createEmergencyAlertDto) {
        const createdAlert = new this.emergencyAlertModel(createEmergencyAlertDto);
        const savedAlert = await createdAlert.save();
        this.eventEmitter.emit('emergency.created', {
            hospitalId: savedAlert.hospital,
            emergency: savedAlert,
        });
        return savedAlert;
    }
    async findAll(hospitalId, status) {
        const query = {};
        if (hospitalId) {
            query.hospital = new mongoose_2.Types.ObjectId(hospitalId);
        }
        if (status) {
            query.status = status;
        }
        return this.emergencyAlertModel
            .find(query)
            .sort({ createdAt: -1 })
            .exec();
    }
    async findOne(id) {
        const alert = await this.emergencyAlertModel.findById(id).exec();
        if (!alert) {
            throw new common_1.NotFoundException(`Emergency alert with ID ${id} not found`);
        }
        return alert;
    }
    async update(id, updateEmergencyAlertDto) {
        const alert = await this.findOne(id);
        const updatedAlert = await this.emergencyAlertModel
            .findByIdAndUpdate(id, updateEmergencyAlertDto, { new: true })
            .exec();
        this.eventEmitter.emit('emergency.updated', {
            hospitalId: updatedAlert.hospital,
            emergency: updatedAlert,
        });
        return updatedAlert;
    }
    async remove(id) {
        const alert = await this.findOne(id);
        await this.emergencyAlertModel.findByIdAndDelete(id).exec();
        this.eventEmitter.emit('emergency.removed', {
            hospitalId: alert.hospital,
            emergencyId: alert._id,
        });
    }
    async resolveAlert(id, resolvedBy) {
        const alert = await this.findOne(id);
        if (alert.status === 'Resolved') {
            throw new common_1.BadRequestException('Alert is already resolved');
        }
        alert.status = 'Resolved';
        alert.resolvedBy = resolvedBy;
        alert.resolvedAt = new Date();
        alert.endTime = new Date();
        const resolvedAlert = await alert.save();
        this.eventEmitter.emit('emergency.resolved', {
            hospitalId: resolvedAlert.hospital,
            emergency: resolvedAlert,
        });
        return resolvedAlert;
    }
    async getActiveAlertCount(hospitalId) {
        return this.emergencyAlertModel.countDocuments({
            hospital: new mongoose_2.Types.ObjectId(hospitalId),
            status: 'Active',
        }).exec();
    }
    async getAlertsByType(hospitalId, startDate, endDate) {
        const dateFilter = {};
        if (startDate) {
            dateFilter.createdAt = { $gte: startDate };
        }
        if (endDate) {
            dateFilter.createdAt = Object.assign(Object.assign({}, dateFilter.createdAt), { $lte: endDate });
        }
        return this.emergencyAlertModel.aggregate([
            {
                $match: Object.assign({ hospital: new mongoose_2.Types.ObjectId(hospitalId) }, dateFilter)
            },
            {
                $group: {
                    _id: '$severity',
                    count: { $sum: 1 },
                    alerts: { $push: '$$ROOT' }
                }
            },
            {
                $project: {
                    severity: '$_id',
                    count: 1,
                    alerts: 1,
                    _id: 0
                }
            }
        ]).exec();
    }
};
EmergencyAlertsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(emergency_alerts_schema_1.EmergencyAlert.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        event_emitter_1.EventEmitter2])
], EmergencyAlertsService);
exports.EmergencyAlertsService = EmergencyAlertsService;
//# sourceMappingURL=emergency-alerts.service.js.map