import { type OnGatewayConnection, type OnGatewayDisconnect, type OnGatewayInit } from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { type EventEmitter2 } from "@nestjs/event-emitter";
import type { JwtService } from "@nestjs/jwt";
import type { Model } from "mongoose";
import { type HospitalDocument } from "../../hospital/schemas/hospital.schema";
import { Surge, type SurgeDocument } from "../../surge/schema/surge.schema";
export declare class SurgeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private eventEmitter;
    private jwtService;
    private hospitalModel;
    private surgeModel;
    server: Server;
    private logger;
    private connectedClients;
    private clientRooms;
    private regionalSubscriptions;
    constructor(eventEmitter: EventEmitter2, jwtService: JwtService, hospitalModel: Model<HospitalDocument>, surgeModel: Model<SurgeDocument>);
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
    handleUnsubscribeRegionalSurges(client: Socket, payload: {
        latitude: number;
        longitude: number;
        radius: number;
        radiusKm?: number;
    }): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    handleUnsubscribeHospitalSurges(client: Socket, payload: {
        hospitalId: string;
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
            _id: import("mongoose").Types.ObjectId;
        };
        timestamp: string;
    }>;
    handleUpdateSurgeStatus(client: Socket, payload: {
        surgeId: string;
        status: string;
        metadata?: Record<string, any>;
    }): Promise<{
        success: boolean;
        message: string;
        surge: Surge & import("mongoose").Document<any, any, any> & {
            _id: import("mongoose").Types.ObjectId;
        };
        timestamp: string;
    }>;
    private sendCurrentSurgeData;
    private sendCurrentRegionalSurgeData;
    private getSurgesInRegion;
    handleSurgeCreated(payload: {
        hospitalId: string;
        surge: any;
    }): Promise<void>;
    handleSurgeUpdated(payload: {
        hospitalId: string;
        surge: any;
    }): Promise<void>;
    private emitToRegionalSubscribers;
    private calculateDistance;
    handleGetConnectionStats(client: Socket): {
        totalClients: number;
        totalRooms: number;
        hospitalRooms: number;
        regionalRooms: number;
        clientRooms: Set<string>;
        timestamp: string;
    };
}
