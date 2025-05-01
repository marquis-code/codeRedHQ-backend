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
exports.SurgeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const hospital_schema_1 = require("../../hospital/schemas/hospital.schema");
const surge_schema_1 = require("../../surge/schema/surge.schema");
let SurgeGateway = class SurgeGateway {
    constructor(eventEmitter, jwtService, hospitalModel, surgeModel) {
        this.eventEmitter = eventEmitter;
        this.jwtService = jwtService;
        this.hospitalModel = hospitalModel;
        this.surgeModel = surgeModel;
        this.logger = new common_1.Logger('SurgeGateway');
        this.connectedClients = new Map();
        this.clientRooms = new Map();
    }
    afterInit(server) {
        this.logger.log('Surge WebSocket Gateway initialized');
        server.use((socket, next) => {
            next();
        });
    }
    handleConnection(client) {
        this.logger.log(`Client connected to surge gateway: ${client.id}`);
        if (!this.clientRooms.has(client.id)) {
            this.clientRooms.set(client.id, new Set());
        }
        client.emit('surge_connection_status', {
            connected: true,
            clientId: client.id,
            timestamp: new Date().toISOString()
        });
        const interval = setInterval(() => {
            client.emit('surge_heartbeat', { timestamp: new Date().toISOString() });
        }, 30000);
        client.data.heartbeatInterval = interval;
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected from surge gateway: ${client.id}`);
        if (client.data.heartbeatInterval) {
            clearInterval(client.data.heartbeatInterval);
        }
        if (this.clientRooms.has(client.id)) {
            const rooms = this.clientRooms.get(client.id);
            rooms.forEach(room => {
                if (this.connectedClients.has(room)) {
                    this.connectedClients.get(room).delete(client.id);
                }
            });
            this.clientRooms.delete(client.id);
        }
    }
    handleSubscribeHospitalSurges(client, payload) {
        try {
            const { hospitalId } = payload;
            this.logger.log(`Client ${client.id} subscribing to hospital surges ${hospitalId}`);
            const roomName = `hospital:${hospitalId}:surges`;
            client.join(roomName);
            if (!this.connectedClients.has(hospitalId)) {
                this.connectedClients.set(hospitalId, new Set());
            }
            this.connectedClients.get(hospitalId).add(client.id);
            if (!this.clientRooms.has(client.id)) {
                this.clientRooms.set(client.id, new Set());
            }
            this.clientRooms.get(client.id).add(hospitalId);
            this.sendCurrentSurgeData(client, hospitalId);
            return {
                success: true,
                message: `Subscribed to hospital surges ${hospitalId}`,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            this.logger.error(`Error subscribing to hospital surges: ${error.message}`);
            throw new websockets_1.WsException(`Failed to subscribe to surges: ${error.message}`);
        }
    }
    handleUnsubscribeHospitalSurges(client, payload) {
        try {
            const { hospitalId } = payload;
            this.logger.log(`Client ${client.id} unsubscribing from hospital surges ${hospitalId}`);
            const roomName = `hospital:${hospitalId}:surges`;
            client.leave(roomName);
            if (this.connectedClients.has(hospitalId)) {
                this.connectedClients.get(hospitalId).delete(client.id);
            }
            if (this.clientRooms.has(client.id)) {
                this.clientRooms.get(client.id).delete(hospitalId);
            }
            return {
                success: true,
                message: `Unsubscribed from hospital surges ${hospitalId}`,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            this.logger.error(`Error unsubscribing from hospital surges: ${error.message}`);
            throw new websockets_1.WsException(`Failed to unsubscribe from surges: ${error.message}`);
        }
    }
    async handleCreateSurge(client, payload) {
        try {
            const { hospitalId, latitude, longitude, address, emergencyType, description, metadata } = payload;
            const newSurge = new this.surgeModel({
                hospital: hospitalId,
                latitude,
                longitude,
                address,
                emergencyType,
                description,
                metadata,
                status: 'pending',
            });
            await newSurge.save();
            const surgeData = newSurge.toObject();
            const eventPayload = {
                hospitalId,
                surge: surgeData,
                timestamp: new Date().toISOString(),
                eventId: `surge_create_${Date.now()}`
            };
            this.server.to(`hospital:${hospitalId}:surges`).emit('surge_created', eventPayload);
            this.emitToRegionalSubscribers(hospitalId, 'hospital_surge_created', eventPayload);
            this.eventEmitter.emit('surge.created', eventPayload);
            return {
                success: true,
                message: 'Surge created successfully',
                surge: surgeData,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            this.logger.error(`Error creating surge: ${error.message}`);
            throw new websockets_1.WsException(`Failed to create surge: ${error.message}`);
        }
    }
    async handleUpdateSurgeStatus(client, payload) {
        try {
            const { surgeId, status, metadata } = payload;
            const surge = await this.surgeModel.findById(surgeId);
            if (!surge) {
                throw new websockets_1.WsException('Surge not found');
            }
            surge.status = status;
            if (metadata) {
                surge.metadata = Object.assign(Object.assign({}, surge.metadata), metadata);
            }
            await surge.save();
            const surgeData = surge.toObject();
            const hospitalId = surge.hospital.toString();
            const eventPayload = {
                hospitalId,
                surge: surgeData,
                timestamp: new Date().toISOString(),
                eventId: `surge_update_${Date.now()}`
            };
            this.server.to(`hospital:${hospitalId}:surges`).emit('surge_updated', eventPayload);
            this.eventEmitter.emit('surge.updated', eventPayload);
            return {
                success: true,
                message: 'Surge updated successfully',
                surge: surgeData,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            this.logger.error(`Error updating surge: ${error.message}`);
            throw new websockets_1.WsException(`Failed to update surge: ${error.message}`);
        }
    }
    async sendCurrentSurgeData(client, hospitalId) {
        try {
            const surges = await this.surgeModel.find({
                hospital: hospitalId,
                status: { $in: ['pending', 'active', 'in-progress'] }
            }).exec();
            if (surges.length > 0) {
                client.emit('initial_surge_data', {
                    hospitalId,
                    surges,
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            this.logger.error(`Error sending current surge data: ${error.message}`);
        }
    }
    handleSurgeCreated(payload) {
        this.logger.log(`Surge created for hospital ${payload.hospitalId}`);
        const eventPayload = Object.assign(Object.assign({}, payload), { timestamp: new Date().toISOString(), eventId: `surge_create_${Date.now()}` });
        this.server.to(`hospital:${payload.hospitalId}:surges`).emit('surge_created', eventPayload);
    }
    handleSurgeUpdated(payload) {
        this.logger.log(`Surge updated for hospital ${payload.hospitalId}`);
        const eventPayload = Object.assign(Object.assign({}, payload), { timestamp: new Date().toISOString(), eventId: `surge_update_${Date.now()}` });
        this.server.to(`hospital:${payload.hospitalId}:surges`).emit('surge_updated', eventPayload);
    }
    async emitToRegionalSubscribers(hospitalId, eventName, payload) {
        try {
            const hospital = await this.hospitalModel.findById(hospitalId).exec();
            if (!hospital)
                return;
            const regionRooms = Array.from(this.server.sockets.adapter.rooms.keys())
                .filter(room => room.startsWith('region:'));
            for (const room of regionRooms) {
                const [, latStr, lngStr, radiusStr] = room.split(':');
                const regionLat = parseFloat(latStr);
                const regionLng = parseFloat(lngStr);
                const radius = parseFloat(radiusStr);
                const distance = this.calculateDistance(regionLat, regionLng, hospital.latitude, hospital.longitude);
                if (distance <= radius) {
                    this.server.to(room).emit(eventName, payload);
                }
            }
        }
        catch (error) {
            this.logger.error(`Error emitting to regional subscribers: ${error.message}`);
        }
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SurgeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe_hospital_surges'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], SurgeGateway.prototype, "handleSubscribeHospitalSurges", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe_hospital_surges'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], SurgeGateway.prototype, "handleUnsubscribeHospitalSurges", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('create_surge'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SurgeGateway.prototype, "handleCreateSurge", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('update_surge_status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SurgeGateway.prototype, "handleUpdateSurgeStatus", null);
__decorate([
    (0, event_emitter_1.OnEvent)('surge.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SurgeGateway.prototype, "handleSurgeCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('surge.updated'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SurgeGateway.prototype, "handleSurgeUpdated", null);
SurgeGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
        pingInterval: 10000,
        pingTimeout: 5000,
    }),
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(hospital_schema_1.Hospital.name)),
    __param(3, (0, mongoose_1.InjectModel)(surge_schema_1.Surge.name)),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2,
        jwt_1.JwtService,
        mongoose_2.Model,
        mongoose_2.Model])
], SurgeGateway);
exports.SurgeGateway = SurgeGateway;
//# sourceMappingURL=surge.gateway.js.map