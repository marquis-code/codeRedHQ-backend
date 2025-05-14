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
    handlePing(client, payload) {
        this.logger.log(`Ping received from client ${client.id}`);
        return { event: 'pong', data: { timestamp: new Date().toISOString() } };
    }
    handleSubscribeHospital(client, payload) {
        try {
            const { hospitalId } = payload;
            if (!hospitalId) {
                throw new websockets_1.WsException('Hospital ID is required');
            }
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
            if (!hospitalId) {
                throw new websockets_1.WsException('Hospital ID is required');
            }
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
            if (latitude === undefined || longitude === undefined || radius === undefined) {
                throw new websockets_1.WsException('Latitude, longitude, and radius are required');
            }
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
            let query;
            if (this.isValidObjectId(hospitalId)) {
                query = {
                    $or: [
                        { hospital: new mongoose_2.Types.ObjectId(hospitalId) },
                        { hospital: hospitalId }
                    ]
                };
            }
            else {
                query = { hospital: hospitalId };
            }
            const bedspaces = await this.bedspaceModel.find(query)
                .maxTimeMS(5000)
                .exec();
            if (bedspaces.length > 0) {
                this.logger.log(`Sending initial bedspace data for hospital ${hospitalId}: ${bedspaces.length} bedspaces found`);
                client.emit('initial_bedspace_data', {
                    hospitalId,
                    bedspaces,
                    timestamp: new Date().toISOString()
                });
            }
            else {
                const hospital = await this.findHospitalByIdOrPlaceId(hospitalId);
                if (hospital) {
                    this.logger.log(`Hospital ${hospitalId} found but no bedspaces available`);
                    client.emit('initial_bedspace_data', {
                        hospitalId,
                        bedspaces: [],
                        message: 'No bedspaces found for this hospital',
                        timestamp: new Date().toISOString()
                    });
                }
                else {
                    this.logger.warn(`Hospital with ID ${hospitalId} not found`);
                    client.emit('error', {
                        code: 'HOSPITAL_NOT_FOUND',
                        message: `Hospital with ID ${hospitalId} not found`,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
        catch (error) {
            this.logger.error(`Error sending current bedspace data: ${error.message}`);
            client.emit('error', {
                code: 'BEDSPACE_DATA_ERROR',
                message: 'Unable to retrieve bedspace data. Please try again later.',
                timestamp: new Date().toISOString()
            });
        }
    }
    isValidObjectId(id) {
        if (!id || typeof id !== 'string') {
            return false;
        }
        return mongoose_2.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
    }
    handleBedspaceUpdated(payload) {
        try {
            if (!payload || !payload.hospitalId) {
                this.logger.error('Invalid bedspace update payload');
                return;
            }
            this.logger.log(`Bedspace updated for hospital ${payload.hospitalId}`);
            const eventPayload = Object.assign(Object.assign({}, payload), { timestamp: new Date().toISOString(), eventId: `bedspace_update_${Date.now()}` });
            const roomName = `hospital:${payload.hospitalId}`;
            this.logger.log(`Emitting bedspace_updated event to room ${roomName}`);
            this.server.to(roomName).emit('bedspace_updated', eventPayload);
            this.emitToRegionalSubscribers(payload.hospitalId, 'hospital_bedspace_updated', eventPayload);
        }
        catch (error) {
            this.logger.error(`Error handling bedspace update: ${error.message}`);
        }
    }
    handleEmergencyCreated(payload) {
        try {
            if (!payload || !payload.hospitalId) {
                this.logger.error('Invalid emergency created payload');
                return;
            }
            this.logger.log(`Emergency created for hospital ${payload.hospitalId}`);
            const eventPayload = Object.assign(Object.assign({}, payload), { timestamp: new Date().toISOString(), eventId: `emergency_create_${Date.now()}` });
            const roomName = `hospital:${payload.hospitalId}`;
            this.logger.log(`Emitting emergency_created event to room ${roomName}`);
            this.server.to(roomName).emit('emergency_created', eventPayload);
            this.emitToRegionalSubscribers(payload.hospitalId, 'hospital_emergency_created', eventPayload);
        }
        catch (error) {
            this.logger.error(`Error handling emergency creation: ${error.message}`);
        }
    }
    handleHospitalStatusChanged(payload) {
        try {
            if (!payload || !payload.hospitalId) {
                this.logger.error('Invalid hospital status change payload');
                return;
            }
            this.logger.log(`Hospital ${payload.hospitalId} status changed to ${payload.status}`);
            const eventPayload = Object.assign(Object.assign({}, payload), { timestamp: new Date().toISOString(), eventId: `status_change_${Date.now()}` });
            this.logger.log('Emitting hospital_status_changed event to all clients');
            this.server.emit('hospital_status_changed', eventPayload);
        }
        catch (error) {
            this.logger.error(`Error handling hospital status change: ${error.message}`);
        }
    }
    async emitToRegionalSubscribers(hospitalId, eventName, payload) {
        try {
            if (!hospitalId) {
                this.logger.error('Invalid hospital ID for regional emission');
                return;
            }
            const hospital = await this.findHospitalByIdOrPlaceId(hospitalId);
            if (!hospital) {
                this.logger.warn(`Hospital ${hospitalId} not found for regional emission`);
                return;
            }
            const regionRooms = Array.from(this.server.sockets.adapter.rooms.keys())
                .filter(room => room.startsWith('region:'));
            for (const room of regionRooms) {
                const [, latStr, lngStr, radiusStr] = room.split(':');
                if (!latStr || !lngStr || !radiusStr) {
                    continue;
                }
                const regionLat = parseFloat(latStr);
                const regionLng = parseFloat(lngStr);
                const radius = parseFloat(radiusStr);
                if (isNaN(regionLat) || isNaN(regionLng) || isNaN(radius)) {
                    continue;
                }
                const distance = this.calculateDistance(regionLat, regionLng, hospital.latitude, hospital.longitude);
                if (distance <= radius) {
                    this.logger.log(`Emitting ${eventName} event to region room ${room}`);
                    this.server.to(room).emit(eventName, payload);
                }
            }
        }
        catch (error) {
            this.logger.error(`Error emitting to regional subscribers: ${error.message}`);
        }
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
            return Infinity;
        }
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
    async findHospitalByIdOrPlaceId(id) {
        try {
            if (!id) {
                this.logger.error('Invalid hospital ID: null or undefined');
                return null;
            }
            const isValidObjectId = id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
            let query;
            if (isValidObjectId) {
                const hospitalById = await this.hospitalModel.findById(id)
                    .select('_id hospitalName latitude longitude location placeId')
                    .lean()
                    .maxTimeMS(3000)
                    .exec();
                if (hospitalById) {
                    return hospitalById;
                }
                query = { placeId: id };
            }
            else {
                query = { placeId: id };
            }
            return await this.hospitalModel.findOne(query)
                .select('_id hospitalName latitude longitude location placeId')
                .lean()
                .maxTimeMS(3000)
                .exec();
        }
        catch (error) {
            this.logger.error(`Error finding hospital: ${error}`);
            return null;
        }
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], BedspaceGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], BedspaceGateway.prototype, "handlePing", null);
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