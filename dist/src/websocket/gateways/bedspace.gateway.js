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
exports.BedspaceGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const hospital_schema_1 = require("../../hospital/schemas/hospital.schema");
const bedspace_schema_1 = require("../../bedspace/schemas/bedspace.schema");
let BedspaceGateway = class BedspaceGateway {
    constructor(eventEmitter, jwtService, hospitalModel, bedspaceModel) {
        this.eventEmitter = eventEmitter;
        this.jwtService = jwtService;
        this.hospitalModel = hospitalModel;
        this.bedspaceModel = bedspaceModel;
        this.logger = new common_1.Logger('BedspaceGateway');
        this.connectedClients = new Map();
        this.clientRooms = new Map();
    }
    afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
        server.use((socket, next) => {
            var _a;
            try {
                const token = socket.handshake.auth.token ||
                    ((_a = socket.handshake.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]);
                if (!token) {
                    socket.data.anonymous = true;
                    return next();
                }
                const payload = this.jwtService.verify(token);
                socket.data.user = payload;
                socket.data.authenticated = true;
                next();
            }
            catch (error) {
                socket.data.anonymous = true;
                next();
            }
        });
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
        if (!this.clientRooms.has(client.id)) {
            this.clientRooms.set(client.id, new Set());
        }
        client.emit('connection_status', {
            connected: true,
            authenticated: client.data.authenticated || false,
            clientId: client.id,
            timestamp: new Date().toISOString()
        });
        const interval = setInterval(() => {
            client.emit('heartbeat', { timestamp: new Date().toISOString() });
        }, 30000);
        client.data.heartbeatInterval = interval;
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
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
    handleSubscribeHospital(client, payload) {
        try {
            const { hospitalId } = payload;
            this.logger.log(`Client ${client.id} subscribing to hospital ${hospitalId}`);
            const roomName = `hospital:${hospitalId}`;
            client.join(roomName);
            if (!this.connectedClients.has(hospitalId)) {
                this.connectedClients.set(hospitalId, new Set());
            }
            this.connectedClients.get(hospitalId).add(client.id);
            if (!this.clientRooms.has(client.id)) {
                this.clientRooms.set(client.id, new Set());
            }
            this.clientRooms.get(client.id).add(hospitalId);
            this.sendCurrentBedspaceData(client, hospitalId);
            return {
                success: true,
                message: `Subscribed to hospital ${hospitalId}`,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            this.logger.error(`Error subscribing to hospital: ${error.message}`);
            throw new websockets_1.WsException(`Failed to subscribe: ${error.message}`);
        }
    }
    handleUnsubscribeHospital(client, payload) {
        try {
            const { hospitalId } = payload;
            this.logger.log(`Client ${client.id} unsubscribing from hospital ${hospitalId}`);
            const roomName = `hospital:${hospitalId}`;
            client.leave(roomName);
            if (this.connectedClients.has(hospitalId)) {
                this.connectedClients.get(hospitalId).delete(client.id);
            }
            if (this.clientRooms.has(client.id)) {
                this.clientRooms.get(client.id).delete(hospitalId);
            }
            return {
                success: true,
                message: `Unsubscribed from hospital ${hospitalId}`,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            this.logger.error(`Error unsubscribing from hospital: ${error.message}`);
            throw new websockets_1.WsException(`Failed to unsubscribe: ${error.message}`);
        }
    }
    handleSubscribeRegion(client, payload) {
        try {
            const { latitude, longitude, radius } = payload;
            const regionKey = `region:${latitude.toFixed(2)}:${longitude.toFixed(2)}:${radius}`;
            this.logger.log(`Client ${client.id} subscribing to region ${regionKey}`);
            client.join(regionKey);
            if (!this.clientRooms.has(client.id)) {
                this.clientRooms.set(client.id, new Set());
            }
            this.clientRooms.get(client.id).add(regionKey);
            return {
                success: true,
                message: `Subscribed to region`,
                regionKey,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            this.logger.error(`Error subscribing to region: ${error.message}`);
            throw new websockets_1.WsException(`Failed to subscribe to region: ${error.message}`);
        }
    }
    handleHeartbeatResponse(client) {
        client.data.lastActivity = new Date();
        return { timestamp: new Date().toISOString() };
    }
    async sendCurrentBedspaceData(client, hospitalId) {
        try {
            const bedspaces = await this.bedspaceModel.find({ hospital: hospitalId }).exec();
            if (bedspaces.length > 0) {
                client.emit('initial_bedspace_data', {
                    hospitalId,
                    bedspaces,
                    timestamp: new Date().toISOString()
                });
            }
        }
        catch (error) {
            this.logger.error(`Error sending current bedspace data: ${error.message}`);
        }
    }
    handleBedspaceUpdated(payload) {
        this.logger.log(`Bedspace updated for hospital ${payload.hospitalId}`);
        const eventPayload = Object.assign(Object.assign({}, payload), { timestamp: new Date().toISOString(), eventId: `bedspace_update_${Date.now()}` });
        this.server.to(`hospital:${payload.hospitalId}`).emit('bedspace_updated', eventPayload);
        this.emitToRegionalSubscribers(payload.hospitalId, 'hospital_bedspace_updated', eventPayload);
    }
    handleEmergencyCreated(payload) {
        this.logger.log(`Emergency created for hospital ${payload.hospitalId}`);
        const eventPayload = Object.assign(Object.assign({}, payload), { timestamp: new Date().toISOString(), eventId: `emergency_create_${Date.now()}` });
        this.server.to(`hospital:${payload.hospitalId}`).emit('emergency_created', eventPayload);
        this.emitToRegionalSubscribers(payload.hospitalId, 'hospital_emergency_created', eventPayload);
    }
    handleHospitalStatusChanged(payload) {
        this.logger.log(`Hospital ${payload.hospitalId} status changed to ${payload.status}`);
        const eventPayload = Object.assign(Object.assign({}, payload), { timestamp: new Date().toISOString(), eventId: `status_change_${Date.now()}` });
        this.server.emit('hospital_status_changed', eventPayload);
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
], BedspaceGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe_hospital'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], BedspaceGateway.prototype, "handleSubscribeHospital", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe_hospital'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], BedspaceGateway.prototype, "handleUnsubscribeHospital", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe_region'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], BedspaceGateway.prototype, "handleSubscribeRegion", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('heartbeat_response'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], BedspaceGateway.prototype, "handleHeartbeatResponse", null);
__decorate([
    (0, event_emitter_1.OnEvent)('bedspace.updated'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BedspaceGateway.prototype, "handleBedspaceUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('emergency.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BedspaceGateway.prototype, "handleEmergencyCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('hospital.status_changed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BedspaceGateway.prototype, "handleHospitalStatusChanged", null);
BedspaceGateway = __decorate([
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
    __param(3, (0, mongoose_1.InjectModel)(bedspace_schema_1.Bedspace.name)),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2,
        jwt_1.JwtService,
        mongoose_2.Model,
        mongoose_2.Model])
], BedspaceGateway);
exports.BedspaceGateway = BedspaceGateway;
//# sourceMappingURL=bedspace.gateway.js.map