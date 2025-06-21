import { type OnGatewayConnection, type OnGatewayDisconnect, type OnGatewayInit } from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { JwtService } from "@nestjs/jwt";
import { Model, Types } from "mongoose";
import { type HospitalDocument } from "../../hospital/schemas/hospital.schema";
import { type BedspaceDocument } from "../../bedspace/schemas/bedspace.schema";
import { type SurgeDocument } from "../../surge/schema/surge.schema";
import { type HospitalClickDocument } from "../../hospital-click/schemas/hospital-click.schema";
import { HospitalClicksService } from "../../hospital-click/hospital-clicks.service";
interface SurgeData {
    hospitalId: string;
    clickCount: number;
    surgeTriggered: boolean;
    contributingClicks: Array<{
        sessionId: string;
        latitude: number;
        longitude: number;
        timestamp: Date;
        distanceFromHospital: number;
        userAgent?: string;
        ipAddress?: string;
    }>;
    averageClickLocation: {
        latitude: number;
        longitude: number;
    };
    hospitalInfo: {
        hospitalId: string;
        name: string;
        latitude: number;
        longitude: number;
    };
    metadata: {
        surgeNumber: number;
        totalUniqueSessions: number;
        timeToSurge: number;
        minDistanceFromHospital: number;
        maxDistanceFromHospital: number;
        averageDistanceFromHospital: number;
    };
}
export declare class UnifiedHospitalGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly eventEmitter;
    private readonly jwtService;
    private readonly hospitalClicksService;
    private readonly hospitalModel;
    private readonly bedspaceModel;
    private readonly surgeModel;
    private readonly hospitalClickModel;
    server: Server;
    private logger;
    private connectedClients;
    private clientRooms;
    private clientChannels;
    private clientSessions;
    private regionalSubscriptions;
    private clickRateLimit;
    private readonly CLICK_RATE_LIMIT;
    private readonly RATE_LIMIT_WINDOW;
    constructor(eventEmitter: EventEmitter2, jwtService: JwtService, hospitalClicksService: HospitalClicksService, hospitalModel: Model<HospitalDocument>, bedspaceModel: Model<BedspaceDocument>, surgeModel: Model<SurgeDocument>, hospitalClickModel: Model<HospitalClickDocument>);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleHospitalClick(data: {
        hospitalId: string;
        latitude: number;
        longitude: number;
        userAgent?: string;
    }, client: Socket): Promise<{
        success: boolean;
        clickCount: number;
        surgeTriggered: boolean;
        message: string;
        isValidLocation: boolean;
        distanceFromHospital: number;
        sessionId: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        isValidLocation: boolean;
        clickCount?: undefined;
        surgeTriggered?: undefined;
        message?: undefined;
        distanceFromHospital?: undefined;
        sessionId?: undefined;
    }>;
    getHospitalClickStats(data: {
        hospitalId: string;
    }, client: Socket): Promise<{
        success: boolean;
        stats: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        stats?: undefined;
    }>;
    getSurgeHistory(data: {
        hospitalId: string;
        limit?: number;
    }, client: Socket): Promise<{
        success: boolean;
        history: {
            hospitalId: string;
            surgeHistory: import("../../hospital-click/schemas/hospital-click.schema").SurgeEvent[];
            limit: number;
            timestamp: string;
            eventId: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        history?: undefined;
    }>;
    handleSubscribeHospitalClicks(client: Socket, payload: {
        hospitalId: string;
    }): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    resetHospitalClicks(data: {
        hospitalId: string;
        adminToken?: string;
    }, client: Socket): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    handleSubscribeHospitalSurges(client: Socket, payload: {
        hospitalId: string;
    }): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    handleSubscribeRegionalSurges(client: Socket, payload: {
        latitude: number;
        longitude: number;
        radius: number;
        radiusKm?: number;
    }): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    handleSubscribeHospital(client: Socket, payload: {
        hospitalId: string;
    }): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    handleUpdateBedSpace(client: Socket, payload: {
        unitId: string;
        availableBeds: number;
        hospitalId?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: BedspaceDocument & {
            _id: Types.ObjectId;
        };
        timestamp: string;
    }>;
    handleLocationValidatedSurgeTriggered(surgeData: SurgeData): Promise<void>;
    handlePing(client: Socket): {
        event: string;
        data: {
            timestamp: string;
        };
    };
    handleGetConnectionStats(client: Socket): {
        totalClients: number;
        totalRooms: number;
        hospitalRooms: number;
        regionalRooms: number;
        clientRooms: Set<string>;
        clientChannels: Set<string>;
        sessionId: string;
        clickValidation: {
            locationValidation: boolean;
            radiusKm: number;
            rateLimit: number;
            rateLimitWindowMs: number;
        };
        timestamp: string;
    };
    private setupHeartbeat;
    private checkRateLimit;
    private updateClientTracking;
    private cleanupClientSubscriptions;
    private emitToHospitalRooms;
    private handleSurgeTriggered;
    private verifyAdminAccess;
    private calculateDistance;
    private sendCurrentSurgeData;
    private sendCurrentRegionalSurgeData;
    private sendCurrentBedspaceData;
    private getSurgesInRegion;
    private emitToRegionalSubscribers;
    private isValidObjectId;
}
export {};
