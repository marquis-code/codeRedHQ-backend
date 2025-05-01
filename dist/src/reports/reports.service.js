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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bedspace_schema_1 = require("../bedspace/schemas/bedspace.schema");
const emergency_alerts_schema_1 = require("../emergency-alerts/schemas/emergency-alerts.schema");
const staff_schema_1 = require("../staffing/schemas/staff.schema");
let ReportsService = class ReportsService {
    constructor(bedspaceModel, emergencyAlertModel, staffModel) {
        this.bedspaceModel = bedspaceModel;
        this.emergencyAlertModel = emergencyAlertModel;
        this.staffModel = staffModel;
    }
    async getBedOccupancyTrends(hospitalId, startDate, endDate) {
        if (!(0, mongoose_2.isValidObjectId)(hospitalId)) {
            throw new common_1.BadRequestException('Invalid hospital ID');
        }
        if (!startDate || !endDate) {
            throw new common_1.BadRequestException('Start date and end date are required');
        }
        const bedspaces = await this.bedspaceModel.find({
            hospital: new mongoose_2.Types.ObjectId(hospitalId),
        }).exec();
        const historyData = [];
        bedspaces.forEach(bedspace => {
            bedspace.history.forEach(entry => {
                if (entry.date >= startDate && entry.date <= endDate) {
                    historyData.push({
                        date: entry.date,
                        department: bedspace.departmentName,
                        available: entry.available,
                        occupied: entry.occupied,
                        total: entry.available + entry.occupied
                    });
                }
            });
        });
        const groupedByDate = historyData.reduce((acc, entry) => {
            const dateStr = entry.date.toISOString().split('T')[0];
            if (!acc[dateStr]) {
                acc[dateStr] = {
                    date: dateStr,
                    totalBeds: 0,
                    availableBeds: 0,
                    occupiedBeds: 0,
                    departments: {}
                };
            }
            acc[dateStr].totalBeds += entry.total;
            acc[dateStr].availableBeds += entry.available;
            acc[dateStr].occupiedBeds += entry.occupied;
            if (!acc[dateStr].departments[entry.department]) {
                acc[dateStr].departments[entry.department] = {
                    totalBeds: 0,
                    availableBeds: 0,
                    occupiedBeds: 0
                };
            }
            acc[dateStr].departments[entry.department].totalBeds += entry.total;
            acc[dateStr].departments[entry.department].availableBeds += entry.available;
            acc[dateStr].departments[entry.department].occupiedBeds += entry.occupied;
            return acc;
        }, {});
        return Object.values(groupedByDate).sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    }
    async getEmergencyAlertsTrends(hospitalId, startDate, endDate) {
        if (!(0, mongoose_2.isValidObjectId)(hospitalId)) {
            throw new common_1.BadRequestException('Invalid hospital ID');
        }
        if (!startDate || !endDate) {
            throw new common_1.BadRequestException('Start date and end date are required');
        }
        const alerts = await this.emergencyAlertModel.find({
            hospital: new mongoose_2.Types.ObjectId(hospitalId),
            createdAt: { $gte: startDate, $lte: endDate }
        }).exec();
        const groupedByDate = alerts.reduce((acc, alert) => {
            const alertDate = alert.createdAt || new Date();
            const dateStr = alertDate.toISOString().split('T')[0];
            if (!acc[dateStr]) {
                acc[dateStr] = {
                    date: dateStr,
                    total: 0,
                    High: 0,
                    Moderate: 0,
                    Low: 0,
                    byDepartment: {}
                };
            }
            acc[dateStr].total++;
            acc[dateStr][alert.severity]++;
            if (alert.affectedDepartment) {
                if (!acc[dateStr].byDepartment[alert.affectedDepartment]) {
                    acc[dateStr].byDepartment[alert.affectedDepartment] = {
                        total: 0,
                        High: 0,
                        Moderate: 0,
                        Low: 0
                    };
                }
                acc[dateStr].byDepartment[alert.affectedDepartment].total++;
                acc[dateStr].byDepartment[alert.affectedDepartment][alert.severity]++;
            }
            return acc;
        }, {});
        return Object.values(groupedByDate).sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    }
    async getStaffAvailabilityTrends(hospitalId, startDate, endDate) {
        if (!(0, mongoose_2.isValidObjectId)(hospitalId)) {
            throw new common_1.BadRequestException('Invalid hospital ID');
        }
        if (!startDate || !endDate) {
            throw new common_1.BadRequestException('Start date and end date are required');
        }
        const staff = await this.staffModel.find({
            hospital: new mongoose_2.Types.ObjectId(hospitalId),
            isActive: true,
            'schedule.date': { $gte: startDate, $lte: endDate }
        }).exec();
        const scheduleData = [];
        staff.forEach(staffMember => {
            staffMember.schedule.forEach(entry => {
                if (entry.date >= startDate && entry.date <= endDate) {
                    scheduleData.push({
                        date: entry.date,
                        department: staffMember.department,
                        position: staffMember.position,
                        shift: entry.shift,
                        status: entry.status
                    });
                }
            });
        });
        const groupedByDate = scheduleData.reduce((acc, entry) => {
            const dateStr = entry.date.toISOString().split('T')[0];
            if (!acc[dateStr]) {
                acc[dateStr] = {
                    date: dateStr,
                    total: 0,
                    available: 0,
                    unavailable: 0,
                    byDepartment: {},
                    byPosition: {},
                    byShift: {}
                };
            }
            acc[dateStr].total++;
            if (entry.status === 'Available') {
                acc[dateStr].available++;
            }
            else {
                acc[dateStr].unavailable++;
            }
            if (!acc[dateStr].byDepartment[entry.department]) {
                acc[dateStr].byDepartment[entry.department] = {
                    total: 0,
                    available: 0,
                    unavailable: 0
                };
            }
            acc[dateStr].byDepartment[entry.department].total++;
            if (entry.status === 'Available') {
                acc[dateStr].byDepartment[entry.department].available++;
            }
            else {
                acc[dateStr].byDepartment[entry.department].unavailable++;
            }
            if (!acc[dateStr].byPosition[entry.position]) {
                acc[dateStr].byPosition[entry.position] = {
                    total: 0,
                    available: 0,
                    unavailable: 0
                };
            }
            acc[dateStr].byPosition[entry.position].total++;
            if (entry.status === 'Available') {
                acc[dateStr].byPosition[entry.position].available++;
            }
            else {
                acc[dateStr].byPosition[entry.position].unavailable++;
            }
            if (!acc[dateStr].byShift[entry.shift]) {
                acc[dateStr].byShift[entry.shift] = {
                    total: 0,
                    available: 0,
                    unavailable: 0
                };
            }
            acc[dateStr].byShift[entry.shift].total++;
            if (entry.status === 'Available') {
                acc[dateStr].byShift[entry.shift].available++;
            }
            else {
                acc[dateStr].byShift[entry.shift].unavailable++;
            }
            return acc;
        }, {});
        return Object.values(groupedByDate).sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    }
    async getDashboardSummary(hospitalId) {
        var _a;
        if (!(0, mongoose_2.isValidObjectId)(hospitalId)) {
            throw new common_1.BadRequestException('Invalid hospital ID');
        }
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const bedspaceSummary = await this.bedspaceModel.aggregate([
            { $match: { hospital: new mongoose_2.Types.ObjectId(hospitalId) } },
            { $group: {
                    _id: null,
                    totalBeds: { $sum: '$totalBeds' },
                    availableBeds: { $sum: '$availableBeds' },
                    occupiedBeds: { $sum: '$occupiedBeds' }
                }
            }
        ]).exec();
        const yesterdayBedspace = await this.bedspaceModel.aggregate([
            { $match: { hospital: new mongoose_2.Types.ObjectId(hospitalId) } },
            { $unwind: '$history' },
            { $match: { 'history.date': { $gte: yesterday, $lt: today } } },
            { $group: {
                    _id: null,
                    totalBeds: { $sum: '$totalBeds' },
                    availableBeds: { $sum: '$history.available' },
                    occupiedBeds: { $sum: '$history.occupied' }
                }
            }
        ]).exec();
        const activeAlerts = await this.emergencyAlertModel.countDocuments({
            hospital: new mongoose_2.Types.ObjectId(hospitalId),
            status: 'Active'
        }).exec();
        const lastWeekAlerts = await this.emergencyAlertModel.countDocuments({
            hospital: new mongoose_2.Types.ObjectId(hospitalId),
            createdAt: { $gte: lastWeek, $lt: today }
        }).exec();
        const staffOnGround = await this.staffModel.countDocuments({
            hospital: new mongoose_2.Types.ObjectId(hospitalId),
            isActive: true,
            availability: 'Available'
        }).exec();
        const yesterdayStaff = await this.staffModel.aggregate([
            { $match: {
                    hospital: new mongoose_2.Types.ObjectId(hospitalId),
                    isActive: true
                }
            },
            { $unwind: '$schedule' },
            { $match: { 'schedule.date': { $gte: yesterday, $lt: today } } },
            { $group: {
                    _id: '$schedule.status',
                    count: { $sum: 1 }
                }
            }
        ]).exec();
        const yesterdayStaffAvailable = ((_a = yesterdayStaff.find(item => item._id === 'Available')) === null || _a === void 0 ? void 0 : _a.count) || 0;
        const bedspace = bedspaceSummary.length > 0 ? bedspaceSummary[0] : { totalBeds: 0, availableBeds: 0, occupiedBeds: 0 };
        const yesterdayBeds = yesterdayBedspace.length > 0 ? yesterdayBedspace[0] : { totalBeds: 0, availableBeds: 0, occupiedBeds: 0 };
        const availableBedChange = yesterdayBeds.availableBeds > 0
            ? ((bedspace.availableBeds - yesterdayBeds.availableBeds) / yesterdayBeds.availableBeds) * 100
            : 0;
        const occupiedBedChangeCalc = yesterdayBeds.occupiedBeds > 0
            ? ((bedspace.occupiedBeds - yesterdayBeds.occupiedBeds) / yesterdayBeds.occupiedBeds) * 100
            : 0;
        const staffChange = yesterdayStaffAvailable > 0
            ? ((staffOnGround - yesterdayStaffAvailable) / yesterdayStaffAvailable) * 100
            : 0;
        return {
            bedspace: {
                availableBeds: bedspace.availableBeds,
                occupiedBeds: bedspace.occupiedBeds,
                totalBeds: bedspace.totalBeds,
                occupancyRate: bedspace.totalBeds > 0 ? (bedspace.occupiedBeds / bedspace.totalBeds) * 100 : 0,
                availableBedChange,
                occupiedBedChange: occupiedBedChangeCalc
            },
            alerts: {
                active: activeAlerts,
                weeklyChange: lastWeekAlerts > 0 ? ((activeAlerts - lastWeekAlerts) / lastWeekAlerts) * 100 : 0
            },
            staff: {
                onGround: staffOnGround,
                change: staffChange
            }
        };
    }
};
ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(bedspace_schema_1.Bedspace.name)),
    __param(1, (0, mongoose_1.InjectModel)(emergency_alerts_schema_1.EmergencyAlert.name)),
    __param(2, (0, mongoose_1.InjectModel)(staff_schema_1.Staff.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ReportsService);
exports.ReportsService = ReportsService;
//# sourceMappingURL=reports.service.js.map