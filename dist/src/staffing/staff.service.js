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
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const staff_schema_1 = require("../staffing/schemas/staff.schema");
const hospital_schema_1 = require("../hospital/schemas/hospital.schema");
let StaffingService = class StaffingService {
    constructor(staffModel, hospitalModel, eventEmitter, jwtService, configService) {
        this.staffModel = staffModel;
        this.hospitalModel = hospitalModel;
        this.eventEmitter = eventEmitter;
        this.jwtService = jwtService;
        this.configService = configService;
        this.MAX_CLOCK_IN_DISTANCE = 500;
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    async register(registerStaffDto) {
        var _a;
        const hospital = await this.hospitalModel.findById(registerStaffDto.hospital);
        if (!hospital) {
            throw new common_1.NotFoundException('Hospital not found');
        }
        const existingStaff = await this.staffModel.findOne({
            hospital: registerStaffDto.hospital,
            email: registerStaffDto.email,
        });
        if (existingStaff) {
            throw new common_1.BadRequestException('Staff with this email already exists in this hospital');
        }
        const staff = new this.staffModel(Object.assign(Object.assign({}, registerStaffDto), { isVerified: false, availability: 'Off Shift' }));
        const savedStaff = await staff.save();
        const token = this.jwtService.sign({
            sub: savedStaff._id.toString(),
            email: savedStaff.email,
            hospitalId: (_a = savedStaff.hospital) === null || _a === void 0 ? void 0 : _a.toString(),
            role: savedStaff.position,
            permissions: savedStaff.permissions || [],
            type: 'staff',
        });
        this.eventEmitter.emit('staff.registered', {
            hospitalId: savedStaff.hospital,
            staff: savedStaff,
        });
        return { staff: savedStaff, token };
    }
    async createAdminForHospital(adminData) {
        var _a;
        const existingAdmin = await this.staffModel.findOne({
            hospital: adminData.hospital,
            email: adminData.email,
        });
        if (existingAdmin) {
            throw new common_1.BadRequestException('Admin with this email already exists for this hospital');
        }
        const staff = new this.staffModel(Object.assign(Object.assign({}, adminData), { isVerified: true, isActive: true, permissions: ['admin', 'manage_staff', 'manage_bedspaces', 'manage_hospital', 'view_reports'], emrAccessLevel: 'admin' }));
        const savedStaff = await staff.save();
        const token = this.jwtService.sign({
            sub: savedStaff._id.toString(),
            email: savedStaff.email,
            hospitalId: (_a = savedStaff.hospital) === null || _a === void 0 ? void 0 : _a.toString(),
            role: savedStaff.position,
            permissions: savedStaff.permissions || [],
            type: 'staff',
        });
        this.eventEmitter.emit('staff.admin_created', {
            hospitalId: savedStaff.hospital,
            staff: savedStaff,
        });
        return { staff: savedStaff, token };
    }
    async login(loginStaffDto) {
        var _a;
        const staff = await this.staffModel.findOne({ email: loginStaffDto.email });
        if (!staff) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await staff.comparePassword(loginStaffDto.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!staff.isActive) {
            throw new common_1.UnauthorizedException('Your account has been deactivated');
        }
        if (!staff.isVerified) {
            throw new common_1.UnauthorizedException('Your account is pending verification by hospital admin');
        }
        const token = this.jwtService.sign({
            sub: staff._id.toString(),
            email: staff.email,
            hospitalId: (_a = staff.hospital) === null || _a === void 0 ? void 0 : _a.toString(),
            role: staff.position,
            permissions: staff.permissions || [],
            type: 'staff',
        });
        return { staff, token };
    }
    async clockIn(staffId, clockInDto) {
        const staff = await this.staffModel.findById(staffId);
        if (!staff) {
            throw new common_1.NotFoundException('Staff not found');
        }
        if (staff.currentShift) {
            throw new common_1.BadRequestException('You are already clocked in. Please clock out first.');
        }
        const hospital = await this.hospitalModel.findById(staff.hospital);
        if (!hospital) {
            throw new common_1.NotFoundException('Hospital not found');
        }
        const distance = this.calculateDistance(clockInDto.latitude, clockInDto.longitude, hospital.latitude, hospital.longitude);
        if (distance > this.MAX_CLOCK_IN_DISTANCE) {
            throw new common_1.ForbiddenException(`Clock in rejected: You are ${Math.round(distance)} meters away from the hospital. ` +
                `You must be within ${this.MAX_CLOCK_IN_DISTANCE} meters to clock in.`);
        }
        staff.currentShift = {
            clockInTime: new Date(),
            clockInLocation: {
                type: 'Point',
                coordinates: [clockInDto.longitude, clockInDto.latitude],
            },
            distanceFromHospital: distance,
            shift: clockInDto.shift,
        };
        staff.availability = 'On Shift';
        staff.lastKnownLocation = {
            type: 'Point',
            coordinates: [clockInDto.longitude, clockInDto.latitude],
        };
        staff.lastLocationUpdate = new Date();
        const updatedStaff = await staff.save();
        this.eventEmitter.emit('staff.clocked_in', {
            hospitalId: staff.hospital,
            staffId: staff._id,
            clockInTime: staff.currentShift.clockInTime,
            distance,
            shift: clockInDto.shift,
        });
        return updatedStaff;
    }
    async clockOut(staffId, clockOutDto) {
        const staff = await this.staffModel.findById(staffId);
        if (!staff) {
            throw new common_1.NotFoundException('Staff not found');
        }
        if (!staff.currentShift) {
            throw new common_1.BadRequestException('You are not clocked in');
        }
        const hospital = await this.hospitalModel.findById(staff.hospital);
        if (!hospital) {
            throw new common_1.NotFoundException('Hospital not found');
        }
        const distance = this.calculateDistance(clockOutDto.latitude, clockOutDto.longitude, hospital.latitude, hospital.longitude);
        staff.attendanceHistory.push({
            clockInTime: staff.currentShift.clockInTime,
            clockOutTime: new Date(),
            clockInLocation: staff.currentShift.clockInLocation,
            clockOutLocation: {
                type: 'Point',
                coordinates: [clockOutDto.longitude, clockOutDto.latitude],
            },
            distanceFromHospital: staff.currentShift.distanceFromHospital,
            shift: staff.currentShift.shift,
            status: 'completed',
            notes: clockOutDto.notes,
        });
        staff.currentShift = null;
        staff.availability = 'Off Shift';
        staff.lastKnownLocation = {
            type: 'Point',
            coordinates: [clockOutDto.longitude, clockOutDto.latitude],
        };
        staff.lastLocationUpdate = new Date();
        const updatedStaff = await staff.save();
        this.eventEmitter.emit('staff.clocked_out', {
            hospitalId: staff.hospital,
            staffId: staff._id,
            clockOutTime: new Date(),
            distance,
        });
        return updatedStaff;
    }
    async getAttendanceHistory(staffId, startDate, endDate) {
        const staff = await this.staffModel.findById(staffId);
        if (!staff) {
            throw new common_1.NotFoundException('Staff not found');
        }
        let history = staff.attendanceHistory;
        if (startDate || endDate) {
            history = history.filter(record => {
                const recordDate = new Date(record.clockInTime);
                if (startDate && recordDate < startDate)
                    return false;
                if (endDate && recordDate > endDate)
                    return false;
                return true;
            });
        }
        const totalShifts = history.length;
        const totalHours = history.reduce((sum, record) => {
            if (record.clockOutTime) {
                const hours = (new Date(record.clockOutTime).getTime() - new Date(record.clockInTime).getTime()) / (1000 * 60 * 60);
                return sum + hours;
            }
            return sum;
        }, 0);
        return {
            staff: {
                id: staff._id,
                name: staff.name,
                department: staff.department,
                position: staff.position,
            },
            statistics: {
                totalShifts,
                totalHours: Math.round(totalHours * 100) / 100,
                averageHoursPerShift: totalShifts > 0 ? Math.round((totalHours / totalShifts) * 100) / 100 : 0,
            },
            history: history.map(record => ({
                clockInTime: record.clockInTime,
                clockOutTime: record.clockOutTime,
                shift: record.shift,
                duration: record.clockOutTime
                    ? Math.round(((new Date(record.clockOutTime).getTime() - new Date(record.clockInTime).getTime()) / (1000 * 60 * 60)) * 100) / 100
                    : null,
                distanceFromHospital: record.distanceFromHospital,
                status: record.status,
                notes: record.notes,
            })),
        };
    }
    async verifyStaff(staffId, permissions = [], emrAccessLevel = 'none') {
        const staff = await this.staffModel.findById(staffId);
        if (!staff) {
            throw new common_1.NotFoundException('Staff not found');
        }
        staff.isVerified = true;
        staff.permissions = permissions;
        staff.emrAccessLevel = emrAccessLevel;
        const updatedStaff = await staff.save();
        this.eventEmitter.emit('staff.verified', {
            hospitalId: staff.hospital,
            staffId: staff._id,
        });
        return updatedStaff;
    }
    async checkPermission(staffId, permission) {
        const staff = await this.staffModel.findById(staffId);
        if (!staff) {
            throw new common_1.NotFoundException('Staff not found');
        }
        return staff.permissions.includes(permission);
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
    async bootstrapAdmin(dto, secretFromHeader) {
        var _a;
        const expectedSecret = this.configService.get('BOOTSTRAP_ADMIN_SECRET');
        if (!expectedSecret) {
            throw new common_1.ForbiddenException('Bootstrap secret is not configured on server');
        }
        if (!secretFromHeader || secretFromHeader !== expectedSecret) {
            throw new common_1.ForbiddenException('Invalid bootstrap secret');
        }
        const hospital = await this.hospitalModel.findById(dto.hospital);
        if (!hospital)
            throw new common_1.NotFoundException('Hospital not found');
        const existingAdmin = await this.staffModel.findOne({
            hospital: dto.hospital,
            permissions: { $in: ['admin'] },
            isActive: true,
        });
        if (existingAdmin) {
            throw new common_1.BadRequestException('Admin already exists for this hospital');
        }
        const existingEmail = await this.staffModel.findOne({ email: dto.email });
        if (existingEmail) {
            throw new common_1.BadRequestException('Email already exists');
        }
        const staff = new this.staffModel(Object.assign(Object.assign({}, dto), { isVerified: true, isActive: true, availability: 'Off Shift', permissions: ['admin', 'manage_staff'], emrAccessLevel: 'admin' }));
        const saved = await staff.save();
        const token = this.jwtService.sign({
            sub: saved._id.toString(),
            email: saved.email,
            hospitalId: (_a = saved.hospital) === null || _a === void 0 ? void 0 : _a.toString(),
            role: saved.position,
            permissions: saved.permissions || [],
            type: 'staff',
        });
        return { staff: saved, token };
    }
    async findAll(hospitalId, department, availability) {
        const query = { isActive: true };
        if (hospitalId) {
            query.hospital = new mongoose_2.Types.ObjectId(hospitalId);
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
        if (!['Available', 'Unavailable', 'On Shift', 'Off Shift'].includes(availability)) {
            throw new common_1.BadRequestException('Invalid availability status');
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
            new mongoose_2.Types.ObjectId(hospitalId);
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid hospital ID');
        }
        const aggregationResult = await this.staffModel.aggregate([
            { $match: { hospital: new mongoose_2.Types.ObjectId(hospitalId), isActive: true } },
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
            onShift: 0,
            available: 0,
            unavailable: 0,
            offShift: 0,
            byDepartment: {},
            byPosition: {}
        };
        aggregationResult.forEach(item => {
            result.total += item.count;
            if (item.availability === 'On Shift') {
                result.onShift = item.count;
            }
            else if (item.availability === 'Available') {
                result.available = item.count;
            }
            else if (item.availability === 'Unavailable') {
                result.unavailable = item.count;
            }
            else if (item.availability === 'Off Shift') {
                result.offShift = item.count;
            }
            item.departments.forEach(staff => {
                if (!result.byDepartment[staff.department]) {
                    result.byDepartment[staff.department] = {
                        total: 0,
                        onShift: 0,
                        available: 0,
                        unavailable: 0,
                        offShift: 0
                    };
                }
                result.byDepartment[staff.department].total++;
                if (item.availability === 'On Shift') {
                    result.byDepartment[staff.department].onShift++;
                }
                else if (item.availability === 'Available') {
                    result.byDepartment[staff.department].available++;
                }
                else if (item.availability === 'Unavailable') {
                    result.byDepartment[staff.department].unavailable++;
                }
                else if (item.availability === 'Off Shift') {
                    result.byDepartment[staff.department].offShift++;
                }
                if (!result.byPosition[staff.position]) {
                    result.byPosition[staff.position] = {
                        total: 0,
                        onShift: 0,
                        available: 0,
                        unavailable: 0,
                        offShift: 0
                    };
                }
                result.byPosition[staff.position].total++;
                if (item.availability === 'On Shift') {
                    result.byPosition[staff.position].onShift++;
                }
                else if (item.availability === 'Available') {
                    result.byPosition[staff.position].available++;
                }
                else if (item.availability === 'Unavailable') {
                    result.byPosition[staff.position].unavailable++;
                }
                else if (item.availability === 'Off Shift') {
                    result.byPosition[staff.position].offShift++;
                }
            });
        });
        return result;
    }
};
StaffingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(staff_schema_1.Staff.name)),
    __param(1, (0, mongoose_1.InjectModel)(hospital_schema_1.Hospital.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        event_emitter_1.EventEmitter2,
        jwt_1.JwtService,
        config_1.ConfigService])
], StaffingService);
exports.StaffingService = StaffingService;
//# sourceMappingURL=staff.service.js.map