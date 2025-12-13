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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const audit_schema_1 = require("./schemas/audit.schema");
let AuditService = class AuditService {
    constructor(auditLogModel) {
        this.auditLogModel = auditLogModel;
    }
    async createLog(logData) {
        const auditLog = new this.auditLogModel(Object.assign(Object.assign({}, logData), { location: logData.location ? {
                type: 'Point',
                coordinates: [logData.location.longitude, logData.location.latitude],
            } : undefined }));
        return auditLog.save();
    }
    async getHospitalLogs(hospitalId, options) {
        const query = { hospital: new mongoose_2.Types.ObjectId(hospitalId) };
        if ((options === null || options === void 0 ? void 0 : options.startDate) || (options === null || options === void 0 ? void 0 : options.endDate)) {
            query.createdAt = {};
            if (options.startDate)
                query.createdAt.$gte = options.startDate;
            if (options.endDate)
                query.createdAt.$lte = options.endDate;
        }
        if (options === null || options === void 0 ? void 0 : options.action) {
            query.action = options.action;
        }
        if (options === null || options === void 0 ? void 0 : options.resourceType) {
            query.resourceType = options.resourceType;
        }
        if (options === null || options === void 0 ? void 0 : options.staffId) {
            query.staff = new mongoose_2.Types.ObjectId(options.staffId);
        }
        const limit = (options === null || options === void 0 ? void 0 : options.limit) || 50;
        const skip = (options === null || options === void 0 ? void 0 : options.skip) || 0;
        const [logs, total] = await Promise.all([
            this.auditLogModel
                .find(query)
                .populate('staff', 'name email position department')
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .exec(),
            this.auditLogModel.countDocuments(query).exec(),
        ]);
        return { logs, total };
    }
    async getResourceHistory(resourceType, resourceId) {
        return this.auditLogModel
            .find({
            resourceType,
            resourceId: new mongoose_2.Types.ObjectId(resourceId),
        })
            .populate('staff', 'name email position department')
            .sort({ createdAt: -1 })
            .exec();
    }
    async getStaffActivity(staffId, startDate, endDate) {
        const query = { staff: new mongoose_2.Types.ObjectId(staffId) };
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = startDate;
            if (endDate)
                query.createdAt.$lte = endDate;
        }
        return this.auditLogModel
            .find(query)
            .populate('hospital', 'hospitalName')
            .sort({ createdAt: -1 })
            .exec();
    }
    async getActivitySummary(hospitalId, startDate, endDate) {
        const result = await this.auditLogModel.aggregate([
            {
                $match: {
                    hospital: new mongoose_2.Types.ObjectId(hospitalId),
                    createdAt: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: {
                        action: '$action',
                        staff: '$staff',
                    },
                    count: { $sum: 1 },
                    lastActivity: { $max: '$createdAt' },
                },
            },
            {
                $lookup: {
                    from: 'staffs',
                    localField: '_id.staff',
                    foreignField: '_id',
                    as: 'staffInfo',
                },
            },
            {
                $unwind: '$staffInfo',
            },
            {
                $group: {
                    _id: '$_id.action',
                    totalCount: { $sum: '$count' },
                    staffActivities: {
                        $push: {
                            staffId: '$_id.staff',
                            staffName: '$staffInfo.name',
                            count: '$count',
                            lastActivity: '$lastActivity',
                        },
                    },
                },
            },
            {
                $sort: { totalCount: -1 },
            },
        ]);
        return result;
    }
};
AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(audit_schema_1.AuditLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AuditService);
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map