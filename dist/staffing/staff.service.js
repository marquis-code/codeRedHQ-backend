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
exports.StaffingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const event_emitter_1 = require("@nestjs/event-emitter");
const mongoose_3 = require("mongoose");
const staff_schema_1 = require("./schemas/staff.schema");
let StaffingService = class StaffingService {
    constructor(staffModel, eventEmitter) {
        this.staffModel = staffModel;
        this.eventEmitter = eventEmitter;
    }
    async create(createStaffDto) {
        const createdStaff = new this.staffModel(createStaffDto);
        const savedStaff = await createdStaff.save();
        this.eventEmitter.emit('staff.created', {
            hospitalId: savedStaff.hospital,
            staff: savedStaff,
        });
        return savedStaff;
    }
    async findAll(hospitalId, department, availability) {
        const query = { isActive: true };
        if (hospitalId) {
            query.hospital = new mongoose_3.Schema.Types.ObjectId(hospitalId);
        }
        if (department) {
            query.department = department;
        }
        if (availability) {
            query.availability = availability;
        }
        return this.staffModel.find(query).exec();
    }
    async findOne(id) {
        const staff = await this.staffModel.findById(id).exec();
        if (!staff) {
            throw new common_1.NotFoundException(`Staff with ID ${id} not found`);
        }
        return staff;
    }
    async update(id, updateStaffDto) {
        const existingStaff = await this.findOne(id);
        const updateData = Object.assign({}, updateStaffDto);
        if (updateData.hospital && typeof updateData.hospital === 'string') {
            updateData.hospital = new mongoose_2.Types.ObjectId(updateData.hospital);
        }
        const updatedStaff = await this.staffModel
            .findOneAndUpdate({ _id: id }, { $set: updateData }, { new: true })
            .exec();
        if (!updatedStaff) {
            throw new common_1.NotFoundException(`Staff with ID ${id} not found`);
        }
        this.eventEmitter.emit('staff.updated', {
            hospitalId: updatedStaff.hospital,
            staff: updatedStaff,
        });
        return updatedStaff;
    }
    async remove(id) {
        const staff = await this.findOne(id);
        await this.staffModel.findByIdAndUpdate(id, { isActive: false }).exec();
        this.eventEmitter.emit('staff.removed', {
            hospitalId: staff.hospital,
            staffId: staff._id,
        });
    }
    async updateAvailability(id, availability) {
        if (!['Available', 'Unavailable'].includes(availability)) {
            throw new common_1.BadRequestException('Availability must be either "Available" or "Unavailable"');
        }
        const staff = await this.findOne(id);
        staff.availability = availability;
        const updatedStaff = await staff.save();
        this.eventEmitter.emit('staff.availability_updated', {
            hospitalId: updatedStaff.hospital,
            staffId: updatedStaff._id,
            availability: updatedStaff.availability,
        });
        return updatedStaff;
    }
    async getStaffSummary(hospitalId) {
        try {
            new mongoose_3.Schema.Types.ObjectId(hospitalId);
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid hospital ID');
        }
        const aggregationResult = await this.staffModel.aggregate([
            { $match: { hospital: new mongoose_3.Schema.Types.ObjectId(hospitalId), isActive: true } },
            { $group: {
                    _id: '$availability',
                    count: { $sum: 1 },
                    departments: {
                        $push: {
                            department: '$department',
                            position: '$position',
                            name: '$name'
                        }
                    }
                }
            },
            {
                $project: {
                    availability: '$_id',
                    count: 1,
                    departments: 1,
                    _id: 0
                }
            }
        ]).exec();
        const result = {
            total: 0,
            available: 0,
            unavailable: 0,
            byDepartment: {},
            byPosition: {}
        };
        aggregationResult.forEach(item => {
            result.total += item.count;
            if (item.availability === 'Available') {
                result.available = item.count;
            }
            else {
                result.unavailable = item.count;
            }
            item.departments.forEach(staff => {
                if (!result.byDepartment[staff.department]) {
                    result.byDepartment[staff.department] = {
                        total: 0,
                        available: 0,
                        unavailable: 0
                    };
                }
                result.byDepartment[staff.department].total++;
                if (item.availability === 'Available') {
                    result.byDepartment[staff.department].available++;
                }
                else {
                    result.byDepartment[staff.department].unavailable++;
                }
                if (!result.byPosition[staff.position]) {
                    result.byPosition[staff.position] = {
                        total: 0,
                        available: 0,
                        unavailable: 0
                    };
                }
                result.byPosition[staff.position].total++;
                if (item.availability === 'Available') {
                    result.byPosition[staff.position].available++;
                }
                else {
                    result.byPosition[staff.position].unavailable++;
                }
            });
        });
        return result;
    }
};
StaffingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(staff_schema_1.Staff.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        event_emitter_1.EventEmitter2])
], StaffingService);
exports.StaffingService = StaffingService;
//# sourceMappingURL=staff.service.js.map