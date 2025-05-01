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
    async create(createAuditLogDto) {
        const createdAuditLog = new this.auditLogModel(createAuditLogDto);
        return createdAuditLog.save();
    }
    async findAll(hospitalId, query = {}) {
        const { page = 1, limit = 20, module, action, startDate, endDate, resourceId } = query;
        const filter = { hospital: new mongoose_2.Types.ObjectId(hospitalId) };
        if (module) {
            filter.module = module;
        }
        if (action) {
            filter.action = action;
        }
        if (resourceId) {
            filter.resourceId = resourceId;
        }
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.auditLogModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.auditLogModel.countDocuments(filter).exec(),
        ]);
        return {
            data,
            total,
            page: Number(page),
            limit: Number(limit),
        };
    }
    async findOne(id) {
        return this.auditLogModel.findById(id).exec();
    }
    async logActivity(hospitalId, module, action, resourceId, previousState = null, newState = null, req) {
        var _a;
        const auditLog = {
            hospital: new mongoose_2.Types.ObjectId(hospitalId),
            module,
            action,
            resourceId,
            previousState,
            newState,
            ipAddress: req === null || req === void 0 ? void 0 : req.ip,
            userAgent: req === null || req === void 0 ? void 0 : req.headers['user-agent'],
            performedBy: ((_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a['hospitalName']) || 'System',
        };
        await this.create(auditLog);
    }
    async getActivitySummary(hospitalId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const activityByModule = await this.auditLogModel.aggregate([
            {
                $match: {
                    hospital: new mongoose_2.Types.ObjectId(hospitalId),
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: { module: '$module', action: '$action' },
                    count: { $sum: 1 },
                },
            },
            {
                $group: {
                    _id: '$_id.module',
                    actions: {
                        $push: {
                            action: '$_id.action',
                            count: '$count',
                        },
                    },
                    totalCount: { $sum: '$count' },
                },
            },
            {
                $project: {
                    module: '$_id',
                    actions: 1,
                    totalCount: 1,
                    _id: 0,
                },
            },
            {
                $sort: { totalCount: -1 },
            },
        ]).exec();
        const activityByDay = await this.auditLogModel.aggregate([
            {
                $match: {
                    hospital: new mongoose_2.Types.ObjectId(hospitalId),
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    date: {
                        $dateFromParts: {
                            year: '$_id.year',
                            month: '$_id.month',
                            day: '$_id.day',
                        },
                    },
                    count: 1,
                    _id: 0,
                },
            },
            {
                $sort: { date: 1 },
            },
        ]).exec();
        return {
            activityByModule,
            activityByDay,
            totalActivities: await this.auditLogModel.countDocuments({
                hospital: new mongoose_2.Types.ObjectId(hospitalId),
                createdAt: { $gte: startDate },
            }).exec(),
        };
    }
};
AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(audit_schema_1.AuditLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AuditService);
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map