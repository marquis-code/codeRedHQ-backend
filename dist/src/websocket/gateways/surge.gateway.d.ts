/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose/types/inferschematype" />
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { HospitalDocument } from '../../hospital/schemas/hospital.schema';
import { Surge, SurgeDocument } from '../../surge/schema/surge.schema';
export declare class SurgeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private eventEmitter;
    private jwtService;
    private hospitalModel;
    private surgeModel;
    server: Server;
    private logger;
    private connectedClients;
    private clientRooms;
    constructor(eventEmitter: EventEmitter2, jwtService: JwtService, hospitalModel: Model<HospitalDocument>, surgeModel: Model<SurgeDocument>);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribeHospitalSurges(client: Socket, payload: {
        hospitalId: string;
    }): {
        success: boolean;
        message: string;
        timestamp: string;
    };
    handleUnsubscribeHospitalSurges(client: Socket, payload: {
        hospitalId: string;
    }): {
        success: boolean;
        message: string;
        timestamp: string;
    };
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
    handleSurgeCreated(payload: {
        hospitalId: string;
        surge: any;
    }): void;
    handleSurgeUpdated(payload: {
        hospitalId: string;
        surge: any;
    }): void;
    private emitToRegionalSubscribers;
    private calculateDistance;
}
