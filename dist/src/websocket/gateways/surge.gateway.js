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
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const mongoose_1 = require("@nestjs/mongoose");
const hospital_schema_1 = require("../../hospital/schemas/hospital.schema");
const surge_schema_1 = require("../../surge/schema/surge.schema");
let SurgeGateway = class SurgeGateway {
    constructor(eventEmitter, jwtService, hospitalModel, surgeModel) {
        this.eventEmitter = eventEmitter;
        this.jwtService = jwtService;
        this.hospitalModel = hospitalModel;
        this.surgeModel = surgeModel;
        this.logger = new common_1.Logger("SurgeGateway");
        this.connectedClients = new Map();
        this.clientRooms = new Map();
        this.regionalSubscriptions = new Map();
    }
    afterInit(server) {
        this.logger.log("🚀 Surge WebSocket Gateway initialized");
        server.use((socket, next) => {
            this.logger.log(`🔌 Socket middleware: ${socket.id}`);
            next();
        });
        this.logger.log("✅ WebSocket server ready to accept connections");
    }
    handleConnection(client) {
        this.logger.log(`🔗 Client connected to surge gateway: ${client.id}`);
        if (!this.clientRooms.has(client.id)) {
            this.clientRooms.set(client.id, new Set());
        }
        client.emit("surge_connection_status", {
            connected: true,
            clientId: client.id,
            timestamp: new Date().toISOString(),
        });
        const interval = setInterval(() => {
            client.emit("surge_heartbeat", { timestamp: new Date().toISOString() });
        }, 30000);
        client.data.heartbeatInterval = interval;
        this.logger.log(`📊 Total connected clients: ${this.server.sockets.sockets.size}`);
    }
    handleDisconnect(client) {
        this.logger.log(`❌ Client disconnected from surge gateway: ${client.id}`);
        if (client.data.heartbeatInterval) {
            clearInterval(client.data.heartbeatInterval);
        }
        if (this.clientRooms.has(client.id)) {
            const rooms = this.clientRooms.get(client.id);
            rooms.forEach((room) => {
                if (this.connectedClients.has(room)) {
                    this.connectedClients.get(room).delete(client.id);
                }
            });
            this.clientRooms.delete(client.id);
        }
        this.logger.log(`📊 Total connected clients: ${this.server.sockets.sockets.size}`);
    }
    async handleSubscribeHospitalSurges(client, payload) {
        try {
            const { hospitalId } = payload;
            this.logger.log(`🏥 Client ${client.id} subscribing to hospital surges ${hospitalId}`);
            const roomName = `hospital:${hospitalId}:surges`;
            await client.join(roomName);
            if (!this.connectedClients.has(hospitalId)) {
                this.connectedClients.set(hospitalId, new Set());
            }
            this.connectedClients.get(hospitalId).add(client.id);
            if (!this.clientRooms.has(client.id)) {
                this.clientRooms.set(client.id, new Set());
            }
            this.clientRooms.get(client.id).add(hospitalId);
            await this.sendCurrentSurgeData(client, hospitalId);
            client.emit("hospital_subscription_confirmed", {
                hospitalId,
                success: true,
                timestamp: new Date().toISOString(),
            });
            this.logger.log(`✅ Client ${client.id} successfully subscribed to hospital ${hospitalId}`);
            return {
                success: true,
                message: `Subscribed to hospital surges ${hospitalId}`,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`❌ Error subscribing to hospital surges: ${error.message}`);
            throw new websockets_1.WsException(`Failed to subscribe to surges: ${error.message}`);
        }
    }
    async handleSubscribeRegionalSurges(client, payload) {
        try {
            const { latitude, longitude, radius, radiusKm } = payload;
            const actualRadius = radiusKm || radius / 1000;
            this.logger.log(`🌍 Client ${client.id} subscribing to regional surges at ${latitude}, ${longitude} within ${actualRadius}km`);
            const roomName = `region:${latitude}:${longitude}:${actualRadius}`;
            await client.join(roomName);
            this.regionalSubscriptions.set(roomName, {
                lat: latitude,
                lng: longitude,
                radius: actualRadius * 1000,
            });
            if (!this.clientRooms.has(client.id)) {
                this.clientRooms.set(client.id, new Set());
            }
            this.clientRooms.get(client.id).add(roomName);
            await this.sendCurrentRegionalSurgeData(client, latitude, longitude, actualRadius);
            client.emit("regional_subscription_confirmed", {
                latitude,
                longitude,
                radiusKm: actualRadius,
                success: true,
                timestamp: new Date().toISOString(),
            });
            this.logger.log(`✅ Client ${client.id} successfully subscribed to regional surges`);
            return {
                success: true,
                message: `Subscribed to regional surges within ${actualRadius}km`,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`❌ Error subscribing to regional surges: ${error.message}`);
            throw new websockets_1.WsException(`Failed to subscribe to regional surges: ${error.message}`);
        }
    }
    async handleUnsubscribeRegionalSurges(client, payload) {
        try {
            const { latitude, longitude, radius, radiusKm } = payload;
            const actualRadius = radiusKm || radius / 1000;
            this.logger.log(`🌍 Client ${client.id} unsubscribing from regional surges`);
            const roomName = `region:${latitude}:${longitude}:${actualRadius}`;
            await client.leave(roomName);
            if (this.clientRooms.has(client.id)) {
                this.clientRooms.get(client.id).delete(roomName);
            }
            return {
                success: true,
                message: `Unsubscribed from regional surges`,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`❌ Error unsubscribing from regional surges: ${error.message}`);
            throw new websockets_1.WsException(`Failed to unsubscribe from regional surges: ${error.message}`);
        }
    }
    async handleUnsubscribeHospitalSurges(client, payload) {
        try {
            const { hospitalId } = payload;
            this.logger.log(`🏥 Client ${client.id} unsubscribing from hospital surges ${hospitalId}`);
            const roomName = `hospital:${hospitalId}:surges`;
            await client.leave(roomName);
            if (this.connectedClients.has(hospitalId)) {
                this.connectedClients.get(hospitalId).delete(client.id);
            }
            if (this.clientRooms.has(client.id)) {
                this.clientRooms.get(client.id).delete(hospitalId);
            }
            return {
                success: true,
                message: `Unsubscribed from hospital surges ${hospitalId}`,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`❌ Error unsubscribing from hospital surges: ${error.message}`);
            throw new websockets_1.WsException(`Failed to unsubscribe from surges: ${error.message}`);
        }
    }
    async handleCreateSurge(client, payload) {
        try {
            const { hospitalId, latitude, longitude, address, emergencyType, description, metadata } = payload;
            this.logger.log(`🚨 Creating surge via WebSocket for hospital ${hospitalId}`);
            const newSurge = new this.surgeModel({
                hospital: hospitalId,
                latitude,
                longitude,
                address,
                emergencyType,
                description,
                metadata,
                status: "pending",
            });
            const savedSurge = await newSurge.save();
            const surgeData = savedSurge.toObject();
            const eventPayload = {
                hospitalId,
                surge: surgeData,
                timestamp: new Date().toISOString(),
                eventId: `surge_create_${Date.now()}`,
            };
            this.server.to(`hospital:${hospitalId}:surges`).emit("surge_created", eventPayload);
            this.server.to(`hospital:${hospitalId}:surges`).emit("new_surge", eventPayload);
            await this.emitToRegionalSubscribers(hospitalId, "hospital_surge_created", eventPayload);
            await this.emitToRegionalSubscribers(hospitalId, "regional_surge_created", eventPayload);
            this.eventEmitter.emit("surge.created", eventPayload);
            this.logger.log(`✅ Surge created and emitted: ${savedSurge._id}`);
            return {
                success: true,
                message: "Surge created successfully",
                surge: surgeData,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`❌ Error creating surge: ${error.message}`);
            throw new websockets_1.WsException(`Failed to create surge: ${error.message}`);
        }
    }
    async handleUpdateSurgeStatus(client, payload) {
        try {
            const { surgeId, status, metadata } = payload;
            this.logger.log(`🔄 Updating surge ${surgeId} status to ${status}`);
            const surge = await this.surgeModel.findById(surgeId);
            if (!surge) {
                throw new websockets_1.WsException("Surge not found");
            }
            surge.status = status;
            if (metadata) {
                surge.metadata = Object.assign(Object.assign({}, surge.metadata), metadata);
            }
            const updatedSurge = await surge.save();
            const surgeData = updatedSurge.toObject();
            const hospitalId = surge.hospital.toString();
            const eventPayload = {
                hospitalId,
                surge: surgeData,
                timestamp: new Date().toISOString(),
                eventId: `surge_update_${Date.now()}`,
            };
            this.server.to(`hospital:${hospitalId}:surges`).emit("surge_updated", eventPayload);
            this.server.to(`hospital:${hospitalId}:surges`).emit("surge.updated", eventPayload);
            await this.emitToRegionalSubscribers(hospitalId, "surge_updated", eventPayload);
            await this.emitToRegionalSubscribers(hospitalId, "hospital_surge_updated", eventPayload);
            this.eventEmitter.emit("surge.updated", eventPayload);
            this.logger.log(`✅ Surge updated and emitted: ${updatedSurge._id}`);
            return {
                success: true,
                message: "Surge updated successfully",
                surge: surgeData,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`❌ Error updating surge: ${error.message}`);
            throw new websockets_1.WsException(`Failed to update surge: ${error.message}`);
        }
    }
    async sendCurrentSurgeData(client, hospitalId) {
        try {
            const surges = await this.surgeModel
                .find({
                hospital: hospitalId,
                status: { $in: ["pending", "active", "in-progress"] },
            })
                .exec();
            if (surges.length > 0) {
                const surgeData = surges.map((surge) => surge.toObject());
                client.emit("initial_surge_data", {
                    hospitalId,
                    surges: surgeData,
                    timestamp: new Date().toISOString(),
                });
                client.emit("hospital_surges_initial", {
                    hospitalId,
                    surges: surgeData,
                    timestamp: new Date().toISOString(),
                });
                this.logger.log(`📤 Sent ${surges.length} initial surges for hospital ${hospitalId} to client ${client.id}`);
            }
            else {
                this.logger.log(`📭 No active surges found for hospital ${hospitalId}`);
            }
        }
        catch (error) {
            this.logger.error(`❌ Error sending current surge data: ${error.message}`);
        }
    }
    async sendCurrentRegionalSurgeData(client, latitude, longitude, radiusKm) {
        try {
            const surges = await this.getSurgesInRegion(latitude, longitude, radiusKm);
            if (surges.length > 0) {
                client.emit("initial_surge_data", {
                    surges,
                    region: { latitude, longitude, radiusKm },
                    timestamp: new Date().toISOString(),
                });
                client.emit("regional_surges_initial", {
                    surges,
                    region: { latitude, longitude, radiusKm },
                    timestamp: new Date().toISOString(),
                });
                this.logger.log(`📤 Sent ${surges.length} initial regional surges to client ${client.id}`);
            }
            else {
                this.logger.log(`📭 No active surges found in region ${latitude}, ${longitude} (${radiusKm}km)`);
            }
        }
        catch (error) {
            this.logger.error(`❌ Error sending current regional surge data: ${error.message}`);
        }
    }
    async getSurgesInRegion(latitude, longitude, radiusKm) {
        try {
            const allSurges = await this.surgeModel
                .find({
                status: { $in: ["pending", "active", "in-progress"] },
            })
                .exec();
            const surgesInRegion = allSurges.filter((surge) => {
                if (!surge.latitude || !surge.longitude)
                    return false;
                const distance = this.calculateDistance(latitude, longitude, surge.latitude, surge.longitude);
                return distance <= radiusKm * 1000;
            });
            return surgesInRegion.map((surge) => surge.toObject());
        }
        catch (error) {
            this.logger.error(`❌ Error getting surges in region: ${error.message}`);
            return [];
        }
    }
    async handleSurgeCreated(payload) {
        this.logger.log(`🚨 SURGE CREATED EVENT RECEIVED for hospital ${payload.hospitalId}`);
        this.logger.log(`🔍 Surge details:`, JSON.stringify(payload.surge, null, 2));
        const eventPayload = Object.assign(Object.assign({}, payload), { timestamp: new Date().toISOString(), eventId: `surge_create_${Date.now()}` });
        const roomName = `hospital:${payload.hospitalId}:surges`;
        const room = this.server.sockets.adapter.rooms.get(roomName);
        const clientCount = room ? room.size : 0;
        this.logger.log(`📊 Room ${roomName} has ${clientCount} clients`);
        this.server.to(roomName).emit("surge_created", eventPayload);
        this.server.to(roomName).emit("new_surge", eventPayload);
        this.server.to(roomName).emit("surge.created", eventPayload);
        this.server.to(roomName).emit("emergency_surge", eventPayload);
        this.server.emit("global_surge_created", eventPayload);
        await this.emitToRegionalSubscribers(payload.hospitalId, "surge_created", eventPayload);
        await this.emitToRegionalSubscribers(payload.hospitalId, "regional_surge_created", eventPayload);
        await this.emitToRegionalSubscribers(payload.hospitalId, "hospital_surge_created", eventPayload);
        this.logger.log(`✅ Surge created event emitted to ${clientCount} clients in room ${roomName}`);
    }
    async handleSurgeUpdated(payload) {
        this.logger.log(`🔄 SURGE UPDATED EVENT RECEIVED for hospital ${payload.hospitalId}`);
        const eventPayload = Object.assign(Object.assign({}, payload), { timestamp: new Date().toISOString(), eventId: `surge_update_${Date.now()}` });
        const roomName = `hospital:${payload.hospitalId}:surges`;
        const room = this.server.sockets.adapter.rooms.get(roomName);
        const clientCount = room ? room.size : 0;
        this.logger.log(`📊 Room ${roomName} has ${clientCount} clients`);
        this.server.to(roomName).emit("surge_updated", eventPayload);
        this.server.to(roomName).emit("surge.updated", eventPayload);
        this.server.to(roomName).emit("hospital_surge_updated", eventPayload);
        this.server.emit("global_surge_updated", eventPayload);
        await this.emitToRegionalSubscribers(payload.hospitalId, "surge_updated", eventPayload);
        await this.emitToRegionalSubscribers(payload.hospitalId, "hospital_surge_updated", eventPayload);
        this.logger.log(`✅ Surge updated event emitted to ${clientCount} clients in room ${roomName}`);
    }
    async emitToRegionalSubscribers(hospitalId, eventName, payload) {
        try {
            const hospital = await this.hospitalModel.findById(hospitalId).exec();
            if (!hospital || !hospital.latitude || !hospital.longitude) {
                this.logger.warn(`⚠️ Hospital ${hospitalId} not found or missing coordinates`);
                return;
            }
            const regionRooms = Array.from(this.server.sockets.adapter.rooms.keys()).filter((room) => room.startsWith("region:"));
            this.logger.log(`🌍 Checking ${regionRooms.length} regional rooms for hospital at ${hospital.latitude}, ${hospital.longitude}`);
            let emittedCount = 0;
            for (const room of regionRooms) {
                try {
                    const [, latStr, lngStr, radiusStr] = room.split(":");
                    const regionLat = Number.parseFloat(latStr);
                    const regionLng = Number.parseFloat(lngStr);
                    const radius = Number.parseFloat(radiusStr) * 1000;
                    const distance = this.calculateDistance(regionLat, regionLng, hospital.latitude, hospital.longitude);
                    if (distance <= radius) {
                        const roomClients = this.server.sockets.adapter.rooms.get(room);
                        const clientCount = roomClients ? roomClients.size : 0;
                        this.logger.log(`📡 Emitting ${eventName} to regional room ${room} (${clientCount} clients, distance: ${Math.round(distance)}m)`);
                        this.server.to(room).emit(eventName, payload);
                        emittedCount++;
                    }
                }
                catch (parseError) {
                    this.logger.error(`❌ Error parsing regional room ${room}: ${parseError.message}`);
                }
            }
            this.logger.log(`✅ Emitted ${eventName} to ${emittedCount} regional rooms`);
        }
        catch (error) {
            this.logger.error(`❌ Error emitting to regional subscribers: ${error.message}`);
        }
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
    handleGetConnectionStats(client) {
        const totalClients = this.server.sockets.sockets.size;
        const rooms = Array.from(this.server.sockets.adapter.rooms.keys());
        const hospitalRooms = rooms.filter((room) => room.startsWith("hospital:"));
        const regionalRooms = rooms.filter((room) => room.startsWith("region:"));
        const stats = {
            totalClients,
            totalRooms: rooms.length,
            hospitalRooms: hospitalRooms.length,
            regionalRooms: regionalRooms.length,
            clientRooms: this.clientRooms.get(client.id) || new Set(),
            timestamp: new Date().toISOString(),
        };
        this.logger.log(`📊 Connection stats requested by ${client.id}:`, stats);
        client.emit("connection_stats", stats);
        return stats;
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", Function)
], SurgeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)("subscribe_hospital_surges"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], SurgeGateway.prototype, "handleSubscribeHospitalSurges", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("subscribe_regional_surges"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], SurgeGateway.prototype, "handleSubscribeRegionalSurges", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("unsubscribe_regional_surges"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], SurgeGateway.prototype, "handleUnsubscribeRegionalSurges", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("unsubscribe_hospital_surges"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], SurgeGateway.prototype, "handleUnsubscribeHospitalSurges", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("create_surge"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], SurgeGateway.prototype, "handleCreateSurge", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("update_surge_status"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], SurgeGateway.prototype, "handleUpdateSurgeStatus", null);
__decorate([
    (0, event_emitter_1.OnEvent)("surge.created"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SurgeGateway.prototype, "handleSurgeCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)("surge.updated"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SurgeGateway.prototype, "handleSurgeUpdated", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("get_connection_stats"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], SurgeGateway.prototype, "handleGetConnectionStats", null);
SurgeGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true,
        },
        transports: ["websocket", "polling"],
        pingInterval: 10000,
        pingTimeout: 5000,
    }),
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(hospital_schema_1.Hospital.name)),
    __param(3, (0, mongoose_1.InjectModel)(surge_schema_1.Surge.name)),
    __metadata("design:paramtypes", [Function, Function, Function, Function])
], SurgeGateway);
exports.SurgeGateway = SurgeGateway;
//# sourceMappingURL=surge.gateway.js.map