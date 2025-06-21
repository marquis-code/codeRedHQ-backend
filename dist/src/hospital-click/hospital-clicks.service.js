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
var HospitalClicksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalClicksService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const event_emitter_1 = require("@nestjs/event-emitter");
const hospital_click_schema_1 = require("./schemas/hospital-click.schema");
const hospital_schema_1 = require("../hospital/schemas/hospital.schema");
let HospitalClicksService = HospitalClicksService_1 = class HospitalClicksService {
    constructor(hospitalClickModel, hospitalModel, eventEmitter) {
        this.hospitalClickModel = hospitalClickModel;
        this.hospitalModel = hospitalModel;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(HospitalClicksService_1.name);
        this.CLICK_THRESHOLD = 5;
        this.LOCATION_RADIUS_KM = 30;
        this.SURGE_WINDOW_MINUTES = 30;
        this.CLICK_WINDOW_MINUTES = 10;
    }
    async handleClick(clickData) {
        try {
            const { hospitalId, sessionId, latitude, longitude, userAgent, ipAddress } = clickData;
            this.logger.log(`Processing click for hospital ${hospitalId} from session ${sessionId} at ${latitude}, ${longitude}`);
            const hospital = await this.getHospitalInfo(hospitalId);
            if (!hospital) {
                throw new Error(`Hospital ${hospitalId} not found or missing location data`);
            }
            const distanceFromHospital = this.calculateDistance(latitude, longitude, hospital.latitude, hospital.longitude);
            this.logger.log(`Click distance from ${hospital.hospitalName}: ${Math.round(distanceFromHospital / 1000)}km`);
            const isValidLocation = distanceFromHospital <= this.LOCATION_RADIUS_KM * 1000;
            if (!isValidLocation) {
                this.logger.log(`Click rejected for ${hospital.hospitalName}: ${Math.round(distanceFromHospital / 1000)}km exceeds ${this.LOCATION_RADIUS_KM}km limit`);
                await this.trackInvalidClick(hospitalId, clickData, distanceFromHospital, hospital);
                return {
                    success: true,
                    clickCount: 0,
                    surgeTriggered: false,
                    message: `Click location is ${Math.round(distanceFromHospital / 1000)}km from ${hospital.hospitalName} (max: ${this.LOCATION_RADIUS_KM}km)`,
                    isValidLocation: false,
                    distanceFromHospital: Math.round(distanceFromHospital / 1000),
                    hospitalInfo: {
                        name: hospital.hospitalName,
                        address: hospital.address,
                        availableBeds: hospital.totalAvailableBeds,
                        bedStatus: hospital.overallBedStatus,
                    },
                };
            }
            const existingRecord = await this.hospitalClickModel.findOne({ hospitalId });
            if (existingRecord && this.isInSurgeCooldown(existingRecord)) {
                const cooldownRemaining = this.getSurgeCooldownRemaining(existingRecord);
                this.logger.log(`Hospital ${hospital.hospitalName} is in surge cooldown period (${Math.round(cooldownRemaining)} minutes remaining)`);
                return {
                    success: true,
                    clickCount: existingRecord.currentClickCount,
                    surgeTriggered: false,
                    message: `${hospital.hospitalName} is in surge cooldown period. Next surge possible in ${Math.round(cooldownRemaining)} minutes`,
                    isValidLocation: true,
                    distanceFromHospital: Math.round(distanceFromHospital / 1000),
                    hospitalInfo: {
                        name: hospital.hospitalName,
                        address: hospital.address,
                        availableBeds: hospital.totalAvailableBeds,
                        bedStatus: hospital.overallBedStatus,
                    },
                };
            }
            await this.cleanupOldClicks(hospitalId);
            let hospitalClick = await this.hospitalClickModel.findOne({ hospitalId });
            if (!hospitalClick) {
                hospitalClick = new this.hospitalClickModel({
                    hospitalId,
                    hospitalLocation: {
                        latitude: hospital.latitude,
                        longitude: hospital.longitude,
                    },
                    currentClickCount: 0,
                    currentClickSessions: [],
                    currentClickDetails: [],
                    surgeHistory: [],
                    status: "active",
                    totalSurgesTriggered: 0,
                    totalValidClicks: 0,
                    totalInvalidClicks: 0,
                });
            }
            const recentClickFromSession = hospitalClick.currentClickDetails.find((detail) => detail.sessionId === sessionId && this.isWithinClickWindow(detail.timestamp));
            if (recentClickFromSession) {
                this.logger.log(`Session ${sessionId} has already clicked recently for ${hospital.hospitalName}`);
                return {
                    success: true,
                    clickCount: hospitalClick.currentClickCount,
                    surgeTriggered: false,
                    message: `Session has already contributed to current surge window for ${hospital.hospitalName}`,
                    isValidLocation: true,
                    distanceFromHospital: Math.round(distanceFromHospital / 1000),
                    hospitalInfo: {
                        name: hospital.hospitalName,
                        address: hospital.address,
                        availableBeds: hospital.totalAvailableBeds,
                        bedStatus: hospital.overallBedStatus,
                    },
                };
            }
            hospitalClick.currentClickDetails.push({
                sessionId,
                latitude,
                longitude,
                timestamp: new Date(),
                distanceFromHospital,
                userAgent,
                ipAddress,
                isValid: true,
            });
            if (!hospitalClick.currentClickSessions.includes(sessionId)) {
                hospitalClick.currentClickSessions.push(sessionId);
            }
            hospitalClick.currentClickCount += 1;
            hospitalClick.totalValidClicks += 1;
            hospitalClick.lastClickTime = new Date();
            const savedRecord = await hospitalClick.save();
            this.logger.log(`Valid click recorded for ${hospital.hospitalName}. Now has ${savedRecord.currentClickCount} clicks`);
            if (savedRecord.currentClickCount >= this.CLICK_THRESHOLD) {
                this.logger.log(`🚨 SURGE THRESHOLD REACHED for ${hospital.hospitalName}!`);
                const surgeData = await this.triggerSurge(savedRecord, hospital);
                return {
                    success: true,
                    clickCount: savedRecord.currentClickCount,
                    surgeTriggered: true,
                    message: `Surge triggered for ${hospital.hospitalName}`,
                    isValidLocation: true,
                    distanceFromHospital: Math.round(distanceFromHospital / 1000),
                    hospitalInfo: {
                        name: hospital.hospitalName,
                        address: hospital.address,
                        availableBeds: hospital.totalAvailableBeds,
                        bedStatus: hospital.overallBedStatus,
                    },
                    data: surgeData,
                };
            }
            return {
                success: true,
                clickCount: savedRecord.currentClickCount,
                surgeTriggered: false,
                message: `Valid click recorded for ${hospital.hospitalName}. ${this.CLICK_THRESHOLD - savedRecord.currentClickCount} more clicks needed for surge`,
                isValidLocation: true,
                distanceFromHospital: Math.round(distanceFromHospital / 1000),
                hospitalInfo: {
                    name: hospital.hospitalName,
                    address: hospital.address,
                    availableBeds: hospital.totalAvailableBeds,
                    bedStatus: hospital.overallBedStatus,
                },
            };
        }
        catch (error) {
            this.logger.error(`Error handling click: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getHospitalInfo(hospitalId) {
        try {
            let hospital = null;
            if (this.isValidObjectId(hospitalId)) {
                hospital = await this.hospitalModel
                    .findById(hospitalId)
                    .select("_id hospitalName address latitude longitude placeId totalBedCount totalAvailableBeds overallBedStatus availableSpecialties emergencyServices contactInformation")
                    .lean()
                    .exec();
            }
            if (!hospital) {
                hospital = await this.hospitalModel
                    .findOne({ placeId: hospitalId })
                    .select("_id hospitalName address latitude longitude placeId totalBedCount totalAvailableBeds overallBedStatus availableSpecialties emergencyServices contactInformation")
                    .lean()
                    .exec();
            }
            if (!hospital) {
                hospital = await this.hospitalModel
                    .findOne({ hospitalName: { $regex: hospitalId, $options: "i" } })
                    .select("_id hospitalName address latitude longitude placeId totalBedCount totalAvailableBeds overallBedStatus availableSpecialties emergencyServices contactInformation")
                    .lean()
                    .exec();
            }
            if (!hospital || !hospital.latitude || !hospital.longitude) {
                this.logger.error(`Hospital ${hospitalId} not found or missing coordinates`);
                return null;
            }
            return hospital;
        }
        catch (error) {
            this.logger.error(`Error getting hospital information: ${error.message}`);
            return null;
        }
    }
    async trackInvalidClick(hospitalId, clickData, distance, hospital) {
        try {
            let hospitalClick = await this.hospitalClickModel.findOne({ hospitalId });
            if (!hospitalClick) {
                hospitalClick = new this.hospitalClickModel({
                    hospitalId,
                    hospitalLocation: {
                        latitude: hospital.latitude,
                        longitude: hospital.longitude,
                    },
                    currentClickCount: 0,
                    currentClickSessions: [],
                    currentClickDetails: [],
                    surgeHistory: [],
                    status: "active",
                    totalSurgesTriggered: 0,
                    totalValidClicks: 0,
                    totalInvalidClicks: 0,
                });
            }
            hospitalClick.totalInvalidClicks += 1;
            await hospitalClick.save();
            this.logger.log(`Invalid click tracked for ${hospital.hospitalName}. Total invalid: ${hospitalClick.totalInvalidClicks}`);
        }
        catch (error) {
            this.logger.error(`Error tracking invalid click: ${error.message}`);
        }
    }
    async triggerSurge(hospitalClick, hospital) {
        var _a;
        try {
            const validClicks = hospitalClick.currentClickDetails.filter((detail) => detail.isValid && this.isWithinClickWindow(detail.timestamp));
            const averageLocation = this.calculateAverageLocation(validClicks);
            const distances = validClicks.map((click) => click.distanceFromHospital);
            const maxDistance = Math.max(...distances);
            const minDistance = Math.min(...distances);
            const firstClickTime = ((_a = validClicks[0]) === null || _a === void 0 ? void 0 : _a.timestamp) || new Date();
            const timeToSurge = Date.now() - firstClickTime.getTime();
            const surgeId = `surge_${hospitalClick.hospitalId}_${Date.now()}_${hospitalClick.totalSurgesTriggered + 1}`;
            const surgeEvent = {
                surgeId,
                triggeredAt: new Date(),
                clickCount: validClicks.length,
                contributingClicks: validClicks.map((click) => ({
                    sessionId: click.sessionId,
                    latitude: click.latitude,
                    longitude: click.longitude,
                    timestamp: click.timestamp,
                    distanceFromHospital: click.distanceFromHospital,
                    userAgent: click.userAgent,
                    ipAddress: click.ipAddress,
                })),
                averageClickLocation: averageLocation,
                timeToSurge,
            };
            hospitalClick.surgeHistory.push(surgeEvent);
            hospitalClick.totalSurgesTriggered += 1;
            hospitalClick.lastSurgeTime = new Date();
            hospitalClick.status = "surge_triggered";
            hospitalClick.currentClickCount = 0;
            hospitalClick.currentClickSessions = [];
            hospitalClick.currentClickDetails = [];
            await hospitalClick.save();
            const surgeData = {
                hospitalId: hospitalClick.hospitalId,
                surgeId,
                clickCount: validClicks.length,
                hospitalInfo: {
                    _id: hospital._id.toString(),
                    hospitalName: hospital.hospitalName,
                    address: hospital.address,
                    latitude: hospital.latitude,
                    longitude: hospital.longitude,
                    placeId: hospital.placeId,
                    totalAvailableBeds: hospital.totalAvailableBeds || 0,
                    overallBedStatus: hospital.overallBedStatus || "Unknown",
                },
                contributingLocations: validClicks.map((click) => ({
                    sessionId: click.sessionId,
                    latitude: click.latitude,
                    longitude: click.longitude,
                    timestamp: click.timestamp,
                    distanceFromHospital: click.distanceFromHospital,
                })),
                averageClickLocation: averageLocation,
                metadata: {
                    totalUniqueSessions: [...new Set(validClicks.map((c) => c.sessionId))].length,
                    timeToSurge,
                    maxDistanceFromHospital: maxDistance,
                    minDistanceFromHospital: minDistance,
                    surgeNumber: hospitalClick.totalSurgesTriggered,
                    timeWindowStart: firstClickTime,
                    timeWindowEnd: new Date(),
                    hospitalCapacityInfo: {
                        totalBeds: hospital.totalBedCount || 0,
                        availableBeds: hospital.totalAvailableBeds || 0,
                        bedStatus: hospital.overallBedStatus || "Unknown",
                        specialties: hospital.availableSpecialties || [],
                    },
                },
            };
            this.eventEmitter.emit("hospital.surge.triggered", surgeData);
            this.logger.log(`✅ Surge ${surgeId} triggered for ${hospital.hospitalName}`, {
                clickCount: validClicks.length,
                uniqueSessions: surgeData.metadata.totalUniqueSessions,
                timeToSurge: `${Math.round(timeToSurge / 1000)}s`,
                surgeNumber: hospitalClick.totalSurgesTriggered,
                averageDistance: `${Math.round(distances.reduce((a, b) => a + b, 0) / distances.length / 1000)}km`,
                hospitalCapacity: `${hospital.totalAvailableBeds}/${hospital.totalBedCount} beds available`,
                bedStatus: hospital.overallBedStatus,
            });
            return surgeData;
        }
        catch (error) {
            this.logger.error(`Error triggering surge: ${error.message}`, error.stack);
            throw error;
        }
    }
    calculateAverageLocation(clicks) {
        if (clicks.length === 0) {
            return { latitude: 0, longitude: 0 };
        }
        const sum = clicks.reduce((acc, click) => ({
            latitude: acc.latitude + click.latitude,
            longitude: acc.longitude + click.longitude,
        }), { latitude: 0, longitude: 0 });
        return {
            latitude: sum.latitude / clicks.length,
            longitude: sum.longitude / clicks.length,
        };
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    isWithinClickWindow(timestamp) {
        const now = new Date();
        const diffMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60);
        return diffMinutes <= this.CLICK_WINDOW_MINUTES;
    }
    isInSurgeCooldown(hospitalClick) {
        if (!hospitalClick.lastSurgeTime)
            return false;
        const now = new Date();
        const diffMinutes = (now.getTime() - hospitalClick.lastSurgeTime.getTime()) / (1000 * 60);
        return diffMinutes < this.SURGE_WINDOW_MINUTES;
    }
    getSurgeCooldownRemaining(hospitalClick) {
        if (!hospitalClick.lastSurgeTime)
            return 0;
        const now = new Date();
        const diffMinutes = (now.getTime() - hospitalClick.lastSurgeTime.getTime()) / (1000 * 60);
        return Math.max(0, this.SURGE_WINDOW_MINUTES - diffMinutes);
    }
    async cleanupOldClicks(hospitalId) {
        try {
            const hospitalClick = await this.hospitalClickModel.findOne({ hospitalId });
            if (hospitalClick) {
                const validClicks = hospitalClick.currentClickDetails.filter((detail) => this.isWithinClickWindow(detail.timestamp));
                const uniqueSessions = [...new Set(validClicks.map((detail) => detail.sessionId))];
                hospitalClick.currentClickCount = validClicks.length;
                hospitalClick.currentClickSessions = uniqueSessions;
                hospitalClick.currentClickDetails = validClicks;
                if (validClicks.length === 0 && !this.isInSurgeCooldown(hospitalClick)) {
                    hospitalClick.status = "active";
                }
                await hospitalClick.save();
            }
        }
        catch (error) {
            this.logger.error(`Error cleaning up old clicks: ${error.message}`);
        }
    }
    isValidObjectId(id) {
        if (!id || typeof id !== "string") {
            return false;
        }
        return /^[0-9a-fA-F]{24}$/.test(id);
    }
    async getHospitalClicks(hospitalId) {
        return await this.hospitalClickModel.findOne({ hospitalId });
    }
    async resetClicks(hospitalId) {
        await this.hospitalClickModel.updateOne({ hospitalId }, {
            currentClickCount: 0,
            currentClickSessions: [],
            currentClickDetails: [],
            status: "active",
            $unset: { lastSurgeTime: 1 },
        });
    }
    async getClickStatistics(hospitalId) {
        const hospitalClick = await this.hospitalClickModel.findOne({ hospitalId });
        const hospital = await this.getHospitalInfo(hospitalId);
        if (!hospitalClick) {
            return {
                hospitalId,
                hospitalInfo: hospital
                    ? {
                        name: hospital.hospitalName,
                        address: hospital.address,
                        availableBeds: hospital.totalAvailableBeds,
                        totalBeds: hospital.totalBedCount,
                        bedStatus: hospital.overallBedStatus,
                        specialties: hospital.availableSpecialties,
                    }
                    : null,
                currentClickCount: 0,
                uniqueSessions: 0,
                status: "active",
                totalSurgesTriggered: 0,
                totalValidClicks: 0,
                totalInvalidClicks: 0,
                inSurgeCooldown: false,
                clicksNeeded: this.CLICK_THRESHOLD,
                locationRadius: this.LOCATION_RADIUS_KM,
                surgeWindow: this.SURGE_WINDOW_MINUTES,
            };
        }
        const validClicks = hospitalClick.currentClickDetails.filter((detail) => detail.isValid && this.isWithinClickWindow(detail.timestamp));
        return {
            hospitalId,
            hospitalInfo: hospital
                ? {
                    name: hospital.hospitalName,
                    address: hospital.address,
                    availableBeds: hospital.totalAvailableBeds,
                    totalBeds: hospital.totalBedCount,
                    bedStatus: hospital.overallBedStatus,
                    specialties: hospital.availableSpecialties,
                    emergencyServices: hospital.emergencyServices,
                    contactInformation: hospital.contactInformation,
                }
                : null,
            currentClickCount: validClicks.length,
            uniqueSessions: [...new Set(validClicks.map((d) => d.sessionId))].length,
            status: hospitalClick.status,
            lastClickTime: hospitalClick.lastClickTime,
            lastSurgeTime: hospitalClick.lastSurgeTime,
            totalSurgesTriggered: hospitalClick.totalSurgesTriggered,
            totalValidClicks: hospitalClick.totalValidClicks,
            totalInvalidClicks: hospitalClick.totalInvalidClicks,
            inSurgeCooldown: this.isInSurgeCooldown(hospitalClick),
            clicksNeeded: Math.max(0, this.CLICK_THRESHOLD - validClicks.length),
            locationRadius: this.LOCATION_RADIUS_KM,
            surgeWindow: this.SURGE_WINDOW_MINUTES,
            cooldownRemaining: this.getSurgeCooldownRemaining(hospitalClick),
            surgeHistory: hospitalClick.surgeHistory.slice(-5),
            hospitalLocation: hospitalClick.hospitalLocation,
        };
    }
    async getSurgeHistory(hospitalId, limit = 10) {
        const hospitalClick = await this.hospitalClickModel.findOne({ hospitalId });
        if (!hospitalClick)
            return [];
        return hospitalClick.surgeHistory.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime()).slice(0, limit);
    }
    async getHospitalsNearLocation(latitude, longitude, radiusKm = 50) {
        try {
            const hospitals = await this.hospitalModel
                .find({
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [longitude, latitude],
                        },
                        $maxDistance: radiusKm * 1000,
                    },
                },
                isActive: true,
            })
                .select("_id hospitalName address latitude longitude totalAvailableBeds overallBedStatus availableSpecialties")
                .limit(20)
                .exec();
            return hospitals;
        }
        catch (error) {
            this.logger.error(`Error finding hospitals near location: ${error.message}`);
            return [];
        }
    }
};
HospitalClicksService = HospitalClicksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(hospital_click_schema_1.HospitalClick.name)),
    __param(1, (0, mongoose_1.InjectModel)(hospital_schema_1.Hospital.name)),
    __metadata("design:paramtypes", [Function, Function, event_emitter_1.EventEmitter2])
], HospitalClicksService);
exports.HospitalClicksService = HospitalClicksService;
//# sourceMappingURL=hospital-clicks.service.js.map