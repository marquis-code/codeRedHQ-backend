import type { Model } from "mongoose";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { HospitalClick, HospitalClickDocument, SurgeEvent } from "./schemas/hospital-click.schema";
import { HospitalDocument } from "../hospital/schemas/hospital.schema";
export interface ClickData {
    hospitalId: string;
    sessionId: string;
    latitude: number;
    longitude: number;
    userAgent?: string;
    ipAddress?: string;
}
export interface SurgeData {
    hospitalId: string;
    surgeId: string;
    clickCount: number;
    hospitalInfo: {
        _id: string;
        hospitalName: string;
        address: string;
        latitude: number;
        longitude: number;
        placeId?: string;
        totalAvailableBeds: number;
        overallBedStatus: string;
    };
    contributingLocations: Array<{
        sessionId: string;
        latitude: number;
        longitude: number;
        timestamp: Date;
        distanceFromHospital: number;
    }>;
    averageClickLocation: {
        latitude: number;
        longitude: number;
    };
    metadata: {
        totalUniqueSessions: number;
        timeToSurge: number;
        maxDistanceFromHospital: number;
        minDistanceFromHospital: number;
        surgeNumber: number;
        timeWindowStart: Date;
        timeWindowEnd: Date;
        hospitalCapacityInfo: {
            totalBeds: number;
            availableBeds: number;
            bedStatus: string;
            specialties: string[];
        };
    };
}
export declare class HospitalClicksService {
    private hospitalClickModel;
    private hospitalModel;
    private eventEmitter;
    private readonly logger;
    private readonly CLICK_THRESHOLD;
    private readonly LOCATION_RADIUS_KM;
    private readonly SURGE_WINDOW_MINUTES;
    private readonly CLICK_WINDOW_MINUTES;
    constructor(hospitalClickModel: Model<HospitalClickDocument>, hospitalModel: Model<HospitalDocument>, eventEmitter: EventEmitter2);
    handleClick(clickData: ClickData): Promise<{
        success: boolean;
        clickCount: number;
        surgeTriggered: boolean;
        message: string;
        isValidLocation: boolean;
        distanceFromHospital?: number;
        hospitalInfo?: any;
        data?: any;
    }>;
    private getHospitalInfo;
    private trackInvalidClick;
    private triggerSurge;
    private calculateAverageLocation;
    private calculateDistance;
    private isWithinClickWindow;
    private isInSurgeCooldown;
    private getSurgeCooldownRemaining;
    private cleanupOldClicks;
    private isValidObjectId;
    getHospitalClicks(hospitalId: string): Promise<HospitalClick | null>;
    resetClicks(hospitalId: string): Promise<void>;
    getClickStatistics(hospitalId: string): Promise<any>;
    getSurgeHistory(hospitalId: string, limit?: number): Promise<SurgeEvent[]>;
    getHospitalsNearLocation(latitude: number, longitude: number, radiusKm?: number): Promise<HospitalDocument[]>;
}
