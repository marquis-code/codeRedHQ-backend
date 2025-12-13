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
exports.StaffingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const staff_service_1 = require("./staff.service");
const create_staff_dto_1 = require("./dto/create-staff.dto");
const bootstrap_admin_dto_1 = require("./dto/bootstrap-admin.dto");
const jwt_auth_gaurd_1 = require("../auth/jwt-auth.gaurd");
const permission_guard_1 = require("../auth/permission.guard");
let StaffingController = class StaffingController {
    constructor(staffingService) {
        this.staffingService = staffingService;
    }
    async register(registerDto) {
        try {
            const result = await this.staffingService.register(registerDto);
            return {
                success: true,
                message: 'Registration successful. Your account is pending verification by hospital admin.',
                data: {
                    staff: {
                        id: result.staff._id,
                        name: result.staff.name,
                        email: result.staff.email,
                        position: result.staff.position,
                        department: result.staff.department,
                        hospital: result.staff.hospital,
                        isVerified: result.staff.isVerified,
                        isActive: result.staff.isActive,
                    },
                    token: result.token,
                },
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async bootstrapAdmin(dto, req) {
        try {
            const secret = req.headers['x-bootstrap-secret'];
            const result = await this.staffingService.bootstrapAdmin(dto, secret);
            return {
                success: true,
                message: 'Bootstrap admin created successfully',
                data: {
                    staff: {
                        id: result.staff._id,
                        name: result.staff.name,
                        email: result.staff.email,
                        hospital: result.staff.hospital,
                        permissions: result.staff.permissions,
                        emrAccessLevel: result.staff.emrAccessLevel,
                        isVerified: result.staff.isVerified,
                        isActive: result.staff.isActive,
                    },
                    token: result.token,
                },
            };
        }
        catch (error) {
            throw new common_1.HttpException({ success: false, message: error.message }, error.status || common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async login(loginDto) {
        try {
            const result = await this.staffingService.login(loginDto);
            return {
                success: true,
                message: 'Login successful',
                data: {
                    staff: {
                        id: result.staff._id,
                        name: result.staff.name,
                        email: result.staff.email,
                        position: result.staff.position,
                        department: result.staff.department,
                        hospital: result.staff.hospital,
                        permissions: result.staff.permissions,
                        emrAccessLevel: result.staff.emrAccessLevel,
                        availability: result.staff.availability,
                        isVerified: result.staff.isVerified,
                        isActive: result.staff.isActive,
                    },
                    token: result.token,
                },
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.UNAUTHORIZED);
        }
    }
    async clockIn(clockInDto, req) {
        var _a, _b, _c;
        try {
            const staffId = req.user.sub;
            const staff = await this.staffingService.clockIn(staffId, clockInDto);
            return {
                success: true,
                message: 'Clocked in successfully',
                data: {
                    staffId: staff._id,
                    name: staff.name,
                    clockInTime: (_a = staff.currentShift) === null || _a === void 0 ? void 0 : _a.clockInTime,
                    shift: (_b = staff.currentShift) === null || _b === void 0 ? void 0 : _b.shift,
                    availability: staff.availability,
                    distanceFromHospital: (_c = staff.currentShift) === null || _c === void 0 ? void 0 : _c.distanceFromHospital,
                    location: staff.lastKnownLocation,
                },
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async clockOut(clockOutDto, req) {
        try {
            const staffId = req.user.sub;
            const staff = await this.staffingService.clockOut(staffId, clockOutDto);
            const lastShift = staff.attendanceHistory[staff.attendanceHistory.length - 1];
            const duration = lastShift.clockOutTime && lastShift.clockInTime
                ? (new Date(lastShift.clockOutTime).getTime() - new Date(lastShift.clockInTime).getTime()) / (1000 * 60 * 60)
                : null;
            return {
                success: true,
                message: 'Clocked out successfully',
                data: {
                    staffId: staff._id,
                    name: staff.name,
                    availability: staff.availability,
                    lastShift: Object.assign(Object.assign({}, lastShift), { durationHours: duration ? Math.round(duration * 100) / 100 : null }),
                },
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAttendanceHistory(req, startDate, endDate) {
        try {
            const staffId = req.user.sub;
            const history = await this.staffingService.getAttendanceHistory(staffId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            return {
                success: true,
                message: 'Attendance history retrieved successfully',
                data: history,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getProfile(req) {
        try {
            const staffId = req.user.sub;
            const staff = await this.staffingService.findOne(staffId);
            const _a = staff.toObject(), { password } = _a, staffData = __rest(_a, ["password"]);
            return {
                success: true,
                message: 'Profile retrieved successfully',
                data: staffData,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async create(createStaffDto) {
        try {
            const staff = await this.staffingService.create(createStaffDto);
            return {
                success: true,
                message: 'Staff created successfully',
                data: staff,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async verifyStaff(id, body) {
        try {
            const staff = await this.staffingService.verifyStaff(id, body.permissions || [], body.emrAccessLevel || 'none');
            return {
                success: true,
                message: 'Staff verified successfully',
                data: staff,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findAll(hospitalId, department, availability) {
        try {
            const staff = await this.staffingService.findAll(hospitalId, department, availability);
            return {
                success: true,
                message: 'Staff list retrieved successfully',
                data: staff,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getStaffSummary(hospitalId) {
        try {
            const summary = await this.staffingService.getStaffSummary(hospitalId);
            return {
                success: true,
                message: 'Staff summary retrieved successfully',
                data: summary,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findOne(id) {
        try {
            const staff = await this.staffingService.findOne(id);
            const _a = staff.toObject(), { password } = _a, staffData = __rest(_a, ["password"]);
            return {
                success: true,
                message: 'Staff retrieved successfully',
                data: staffData,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.NOT_FOUND);
        }
    }
    async update(id, updateStaffDto) {
        try {
            const staff = await this.staffingService.update(id, updateStaffDto);
            return {
                success: true,
                message: 'Staff updated successfully',
                data: staff,
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async remove(id) {
        try {
            await this.staffingService.remove(id);
            return {
                success: true,
                message: 'Staff deactivated successfully',
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateAvailability(id, availability) {
        try {
            const staff = await this.staffingService.updateAvailability(id, availability);
            return {
                success: true,
                message: 'Availability updated successfully',
                data: {
                    staffId: staff._id,
                    name: staff.name,
                    availability: staff.availability,
                },
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: error.message,
            }, error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Register new staff member' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Staff registered successfully. Awaiting admin verification.'
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input or email already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_dto_1.RegisterStaffDto]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('bootstrap-admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Bootstrap first hospital admin (one-time per hospital)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Admin created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden / invalid secret' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Admin already exists for hospital' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bootstrap_admin_dto_1.BootstrapAdminDto, Object]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "bootstrapAdmin", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Staff login' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials or account not verified' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_dto_1.LoginStaffDto]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('clock-in'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_gaurd_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Clock in for shift (requires authentication)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Clocked in successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Already clocked in or too far from hospital' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_dto_1.ClockInDto, Object]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "clockIn", null);
__decorate([
    (0, common_1.Post)('clock-out'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_gaurd_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Clock out from shift (requires authentication)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Clocked out successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Not currently clocked in' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_dto_1.ClockOutDto, Object]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "clockOut", null);
__decorate([
    (0, common_1.Get)('attendance/history'),
    (0, common_1.UseGuards)(jwt_auth_gaurd_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get attendance history (requires authentication)' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String, example: '2024-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String, example: '2024-12-31' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attendance history retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "getAttendanceHistory", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_gaurd_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current staff profile (requires authentication)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseGuards)(jwt_auth_gaurd_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, permission_guard_1.Permissions)('admin', 'manage_staff'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create staff member (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Staff created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_dto_1.CreateStaffDto]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id/verify'),
    (0, common_1.UseGuards)(jwt_auth_gaurd_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, permission_guard_1.Permissions)('admin', 'manage_staff'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Verify staff account (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Staff ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Staff verified successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "verifyStaff", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_gaurd_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all staff members (requires authentication)' }),
    (0, swagger_1.ApiQuery)({ name: 'hospitalId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'department', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'availability', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Staff list retrieved successfully' }),
    __param(0, (0, common_1.Query)('hospitalId')),
    __param(1, (0, common_1.Query)('department')),
    __param(2, (0, common_1.Query)('availability')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('hospital/:hospitalId/summary'),
    (0, common_1.UseGuards)(jwt_auth_gaurd_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get staff summary for hospital (requires authentication)' }),
    (0, swagger_1.ApiParam)({ name: 'hospitalId', description: 'Hospital ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Staff summary retrieved successfully' }),
    __param(0, (0, common_1.Param)('hospitalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "getStaffSummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_gaurd_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get staff by ID (requires authentication)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Staff ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Staff retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Staff not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_gaurd_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update staff (requires authentication)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Staff ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Staff updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Staff not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_staff_dto_1.UpdateStaffDto]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_gaurd_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, permission_guard_1.Permissions)('admin', 'manage_staff'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete/Deactivate staff (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Staff ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Staff deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/availability'),
    (0, common_1.UseGuards)(jwt_auth_gaurd_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update staff availability (requires authentication)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Staff ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Availability updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('availability')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StaffingController.prototype, "updateAvailability", null);
StaffingController = __decorate([
    (0, swagger_1.ApiTags)('Staff Management'),
    (0, common_1.Controller)('staff'),
    __metadata("design:paramtypes", [staff_service_1.StaffingService])
], StaffingController);
exports.StaffingController = StaffingController;
//# sourceMappingURL=staff.controller.js.map