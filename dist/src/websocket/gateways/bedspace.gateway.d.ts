import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { HospitalDocument } from '../../hospital/schemas/hospital.schema';
import { BedspaceDocument } from '../../bedspace/schemas/bedspace.schema';
export declare class BedspaceGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private eventEmitter;
    private jwtService;
    private hospitalModel;
    private bedspaceModel;
    server: Server;
    private logger;
    private connectedClients;
    private clientRooms;
    constructor(eventEmitter: EventEmitter2, jwtService: JwtService, hospitalModel: Model<HospitalDocument>, bedspaceModel: Model<BedspaceDocument>);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribeHospital(client: Socket, payload: {
        hospitalId: string;
    }): {
        success: boolean;
        message: string;
        timestamp: string;
    };
    handleUnsubscribeHospital(client: Socket, payload: {
        hospitalId: string;
    }): {
        success: boolean;
        message: string;
        timestamp: string;
    };
    handleSubscribeRegion(client: Socket, payload: {
        latitude: number;
        longitude: number;
        radius: number;
    }): {
        success: boolean;
        message: string;
        regionKey: string;
        timestamp: string;
    };
    handleHeartbeatResponse(client: Socket): {
        timestamp: string;
    };
    private sendCurrentBedspaceData;
    private isValidObjectId;
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
    private emitToRegionalSubscribers;
    private calculateDistance;
    private findHospitalByIdOrPlaceId;
}
