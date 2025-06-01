import { type OnGatewayConnection, type OnGatewayDisconnect, type OnGatewayInit } from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { JwtService } from "@nestjs/jwt";
import { type Model, Types } from "mongoose";
import { type HospitalDocument } from "../../hospital/schemas/hospital.schema";
import { type BedspaceDocument } from "../../bedspace/schemas/bedspace.schema";
import { Surge, type SurgeDocument } from "../../surge/schema/surge.schema";
export declare class UnifiedHospitalGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly eventEmitter;
    private readonly jwtService;
    private readonly hospitalModel;
    private readonly bedspaceModel;
    private readonly surgeModel;
    server: Server;
    private logger;
    private connectedClients;
    private clientRooms;
    private clientChannels;
    private regionalSubscriptions;
    constructor(eventEmitter: EventEmitter2, jwtService: JwtService, hospitalModel: Model<HospitalDocument>, bedspaceModel: Model<BedspaceDocument>, surgeModel: Model<SurgeDocument>);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
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
    handleUnsubscribeHospital(client: Socket, payload: {
        hospitalId: string;
    }): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    handleSubscribeChannel(client: Socket, payload: {
        channel: string;
    }): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    handleCreateSurge(client: Socket, payload: {
        hospitalId: string;
        latitude: number;
        longitude: number;
        address?: string;
        emergencyType?: string;
        description?: string;
        metadata?: Record<string, any>;
    }): Promise<{
        success: boolean;
        message: string;
        surge: Surge & import("mongoose").Document<any, any, any> & {
            _id: Types.ObjectId;
        };
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
    handleEmergencyNotification(client: Socket, payload: {
        hospitalId: string;
        userLocation: string;
        latitude: number;
        longitude: number;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            hospitalId: string;
            userLocation: string;
            latitude: number;
            longitude: number;
            timestamp: string;
            eventId: string;
        };
        timestamp: string;
    }>;
    handleGetInitialBedspaceData(client: Socket, payload: {
        hospitalId: string;
    }): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    handlePing(client: Socket, payload: any): {
        event: string;
        data: {
            timestamp: string;
        };
    };
    handleHeartbeatResponse(client: Socket): {
        timestamp: string;
    };
    private sendCurrentSurgeData;
    private sendCurrentRegionalSurgeData;
    private sendCurrentBedspaceData;
    private getSurgesInRegion;
    private emitToRegionalSubscribers;
    private calculateDistance;
    private isValidObjectId;
    private findHospitalByIdOrPlaceId;
    handleSurgeCreated(payload: {
        hospitalId: string;
        surge: any;
    }): Promise<void>;
    handleSurgeUpdated(payload: {
        hospitalId: string;
        surge: any;
    }): Promise<void>;
    handleBedspaceUpdated(payload: {
        hospitalId: string;
        bedspace: any;
    }): void;
    handleEmergencyCreated(payload: {
        hospitalId: string;
        emergency: any;
    }): void;
    handleHospitalStatusChanged(payload: {
        hospitalId: string;
        status: string;
    }): void;
    handleGetConnectionStats(client: Socket): {
        totalClients: number;
        totalRooms: number;
        hospitalRooms: number;
        regionalRooms: number;
        generalChannels: number;
        clientRooms: Set<string>;
        clientChannels: Set<string>;
        timestamp: string;
    };
}
