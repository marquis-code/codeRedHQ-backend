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
exports.BedspaceService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const event_emitter_1 = require("@nestjs/event-emitter");
const bedspace_schema_1 = require("./schemas/bedspace.schema");
const staff_schema_1 = require("../staffing/schemas/staff.schema");
const audit_service_1 = require("../audit/audit.service");
let BedspaceService = class BedspaceService {
    constructor(bedspaceModel, staffModel, eventEmitter, auditLogService) {
        this.bedspaceModel = bedspaceModel;
        this.staffModel = staffModel;
        this.eventEmitter = eventEmitter;
        this.auditLogService = auditLogService;
    }
    async create(createBedspaceDto) {
        if (createBedspaceDto.availableBeds + createBedspaceDto.occupiedBeds !== createBedspaceDto.totalBeds) {
            throw new common_1.BadRequestException('Available beds + occupied beds must equal total beds');
        }
        const createdBedspace = new this.bedspaceModel(createBedspaceDto);
        const savedBedspace = await createdBedspace.save();
        this.eventEmitter.emit('bedspace.created', {
            hospitalId: savedBedspace.hospital,
            bedspace: savedBedspace,
        });
        return savedBedspace;
    }
    async findAllBedspaces(hospitalId) {
        const query = hospitalId ? { hospital: new mongoose_2.Types.ObjectId(hospitalId) } : {};
        return this.bedspaceModel.find(query).exec();
    }
    async findOne(id) {
        const bedspace = await this.bedspaceModel.findById(id).exec();
        if (!bedspace) {
            throw new common_1.NotFoundException(`Bedspace with ID ${id} not found`);
        }
        return bedspace;
    }
    async updateByStaff(bedspaceId, staffId, updateData, metadata) {
        var _a, _b;
        const staff = await this.staffModel.findById(staffId);
        if (!staff) {
            throw new common_1.NotFoundException('Staff not found');
        }
        if (!staff.isVerified || !staff.isActive) {
            throw new common_1.ForbiddenException('Your account is not authorized to update bedspace');
        }
        if (!staff.permissions.includes('manage_bedspace')) {
            throw new common_1.ForbiddenException('You do not have permission to manage bedspace');
        }
        const bedspace = await this.findOne(bedspaceId);
        if (bedspace.hospital.toString() !== staff.hospital.toString()) {
            throw new common_1.ForbiddenException('You can only update bedspaces in your own hospital');
        }
        const previousState = {
            availableBeds: bedspace.availableBeds,
            occupiedBeds: bedspace.occupiedBeds,
            totalBeds: bedspace.totalBeds,
            status: bedspace.status,
        };
        let newAvailable = (_a = updateData.availableBeds) !== null && _a !== void 0 ? _a : bedspace.availableBeds;
        let newOccupied = (_b = updateData.occupiedBeds) !== null && _b !== void 0 ? _b : bedspace.occupiedBeds;
        if (newAvailable + newOccupied !== bedspace.totalBeds) {
            throw new common_1.BadRequestException(`Invalid update: Available (${newAvailable}) + Occupied (${newOccupied}) must equal Total (${bedspace.totalBeds})`);
        }
        if (newAvailable < 0 || newOccupied < 0) {
            throw new common_1.BadRequestException('Bed counts cannot be negative');
        }
        bedspace.availableBeds = newAvailable;
        bedspace.occupiedBeds = newOccupied;
        const updatedBedspace = await bedspace.save();
        await this.auditLogService.createLog({
            hospital: bedspace.hospital,
            staff: staff._id,
            action: 'bedspace_update',
            resourceType: 'Bedspace',
            resourceId: bedspace._id,
            previousState,
            newState: {
                availableBeds: updatedBedspace.availableBeds,
                occupiedBeds: updatedBedspace.occupiedBeds,
                totalBeds: updatedBedspace.totalBeds,
                status: updatedBedspace.status,
            },
            metadata: Object.assign(Object.assign({}, metadata), { staffName: staff.name, staffPosition: staff.position, department: staff.department }),
            notes: updateData.notes,
            location: metadata === null || metadata === void 0 ? void 0 : metadata.location,
            status: 'success',
            ipAddress: metadata === null || metadata === void 0 ? void 0 : metadata.ipAddress,
            userAgent: metadata === null || metadata === void 0 ? void 0 : metadata.userAgent,
        });
        this.eventEmitter.emit('bedspace.updated', {
            hospitalId: updatedBedspace.hospital,
            bedspace: updatedBedspace,
            updatedBy: staff._id,
        });
        return updatedBedspace;
    }
    async admitPatient(bedspaceId, staffId, metadata) {
        const bedspace = await this.findOne(bedspaceId);
        if (bedspace.availableBeds <= 0) {
            throw new common_1.BadRequestException('No available beds for admission');
        }
        return this.updateByStaff(bedspaceId, staffId, {
            availableBeds: bedspace.availableBeds - 1,
            occupiedBeds: bedspace.occupiedBeds + 1,
            notes: (metadata === null || metadata === void 0 ? void 0 : metadata.notes) || 'Patient admitted',
        }, metadata);
    }
    async dischargePatient(bedspaceId, staffId, metadata) {
        const bedspace = await this.findOne(bedspaceId);
        if (bedspace.occupiedBeds <= 0) {
            throw new common_1.BadRequestException('No occupied beds to discharge');
        }
        return this.updateByStaff(bedspaceId, staffId, {
            availableBeds: bedspace.availableBeds + 1,
            occupiedBeds: bedspace.occupiedBeds - 1,
            notes: (metadata === null || metadata === void 0 ? void 0 : metadata.notes) || 'Patient discharged',
        }, metadata);
    }
    async getBedspaceHistory(bedspaceId) {
        const bedspace = await this.findOne(bedspaceId);
        const auditLogs = await this.auditLogService.getResourceHistory('Bedspace', bedspaceId);
        return {
            bedspace: {
                id: bedspace._id,
                departmentName: bedspace.departmentName,
                location: bedspace.location,
                currentState: {
                    totalBeds: bedspace.totalBeds,
                    availableBeds: bedspace.availableBeds,
                    occupiedBeds: bedspace.occupiedBeds,
                    status: bedspace.status,
                },
            },
            history: auditLogs.map(log => ({
                timestamp: log.createdAt,
                staff: log.staff,
                action: log.action,
                previousState: log.previousState,
                newState: log.newState,
                notes: log.notes,
                location: log.location,
            })),
        };
    }
    async update(id, updateBedspaceDto) {
        const bedspace = await this.findOne(id);
        if (updateBedspaceDto.availableBeds !== undefined &&
            updateBedspaceDto.occupiedBeds !== undefined &&
            updateBedspaceDto.totalBeds !== undefined) {
            if (updateBedspaceDto.availableBeds + updateBedspaceDto.occupiedBeds !== updateBedspaceDto.totalBeds) {
                throw new common_1.BadRequestException('Available beds + occupied beds must equal total beds');
            }
        }
        else if (updateBedspaceDto.availableBeds !== undefined &&
            updateBedspaceDto.occupiedBeds !== undefined) {
            updateBedspaceDto.totalBeds = updateBedspaceDto.availableBeds + updateBedspaceDto.occupiedBeds;
        }
        else if (updateBedspaceDto.availableBeds !== undefined) {
            const currentOccupied = bedspace.occupiedBeds;
            const newTotal = updateBedspaceDto.totalBeds || bedspace.totalBeds;
            updateBedspaceDto.occupiedBeds = newTotal - updateBedspaceDto.availableBeds;
        }
        else if (updateBedspaceDto.occupiedBeds !== undefined) {
            const newTotal = updateBedspaceDto.totalBeds || bedspace.totalBeds;
            updateBedspaceDto.availableBeds = newTotal - updateBedspaceDto.occupiedBeds;
        }
        const updatedBedspace = await this.bedspaceModel
            .findByIdAndUpdate(id, updateBedspaceDto, { new: true })
            .exec();
        this.eventEmitter.emit('bedspace.updated', {
            hospitalId: updatedBedspace.hospital,
            bedspace: updatedBedspace,
        });
        return updatedBedspace;
    }
    async remove(id) {
        const bedspace = await this.findOne(id);
        await this.bedspaceModel.findByIdAndDelete(id).exec();
        this.eventEmitter.emit('bedspace.removed', {
            hospitalId: bedspace.hospital,
            bedspaceId: bedspace._id,
        });
    }
    async getHospitalSummary(hospitalId) {
        try {
            new mongoose_2.Types.ObjectId(hospitalId);
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid hospital ID');
        }
        const aggregationResult = await this.bedspaceModel.aggregate([
            { $match: { hospital: new mongoose_2.Types.ObjectId(hospitalId) } },
            { $group: {
                    _id: null,
                    totalBeds: { $sum: '$totalBeds' },
                    availableBeds: { $sum: '$availableBeds' },
                    occupiedBeds: { $sum: '$occupiedBeds' },
                    departments: { $push: {
                            name: '$departmentName',
                            location: '$location',
                            totalBeds: '$totalBeds',
                            availableBeds: '$availableBeds',
                            occupiedBeds: '$occupiedBeds',
                            status: '$status',
                            lastUpdated: '$lastUpdated'
                        } }
                }
            }
        ]).exec();
        if (!aggregationResult.length) {
            return {
                totalBeds: 0,
                availableBeds: 0,
                occupiedBeds: 0,
                occupancyRate: 0,
                departments: []
            };
        }
        const result = aggregationResult[0];
        const occupancyRate = result.totalBeds > 0
            ? Math.round((result.occupiedBeds / result.totalBeds) * 100)
            : 0;
        return {
            totalBeds: result.totalBeds,
            availableBeds: result.availableBeds,
            occupiedBeds: result.occupiedBeds,
            occupancyRate,
            departments: result.departments
        };
    }
    async updateBedAvailability(id, increment) {
        const bedspace = await this.findOne(id);
        if (increment) {
            if (bedspace.occupiedBeds <= 0) {
                throw new common_1.BadRequestException('No occupied beds to discharge');
            }
            bedspace.availableBeds += 1;
            bedspace.occupiedBeds -= 1;
        }
        else {
            if (bedspace.availableBeds <= 0) {
                throw new common_1.BadRequestException('No available beds for admission');
            }
            bedspace.availableBeds -= 1;
            bedspace.occupiedBeds += 1;
        }
        const updatedBedspace = await bedspace.save();
        this.eventEmitter.emit('bedspace.updated', {
            hospitalId: updatedBedspace.hospital,
            bedspace: updatedBedspace,
        });
        return updatedBedspace;
    }
};
BedspaceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(bedspace_schema_1.Bedspace.name)),
    __param(1, (0, mongoose_1.InjectModel)(staff_schema_1.Staff.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        event_emitter_1.EventEmitter2,
        audit_service_1.AuditService])
], BedspaceService);
exports.BedspaceService = BedspaceService;
//# sourceMappingURL=bedspace.service.js.map