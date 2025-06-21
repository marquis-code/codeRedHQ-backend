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
exports.UnifiedHospitalGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const hospital_schema_1 = require("../../hospital/schemas/hospital.schema");
const bedspace_schema_1 = require("../../bedspace/schemas/bedspace.schema");
const surge_schema_1 = require("../../surge/schema/surge.schema");
const hospital_click_schema_1 = require("../../hospital-click/schemas/hospital-click.schema");
const hospital_clicks_service_1 = require("../../hospital-click/hospital-clicks.service");
let UnifiedHospitalGateway = class UnifiedHospitalGateway {
    constructor(eventEmitter, jwtService, hospitalClicksService, hospitalModel, bedspaceModel, surgeModel, hospitalClickModel) {
        this.eventEmitter = eventEmitter;
        this.jwtService = jwtService;
        this.hospitalClicksService = hospitalClicksService;
        this.hospitalModel = hospitalModel;
        this.bedspaceModel = bedspaceModel;
        this.surgeModel = surgeModel;
        this.hospitalClickModel = hospitalClickModel;
        this.logger = new common_1.Logger("UnifiedHospitalGateway");
        this.connectedClients = new Map();
        this.clientRooms = new Map();
        this.clientChannels = new Map();
        this.clientSessions = new Map();
        this.regionalSubscriptions = new Map();
        this.clickRateLimit = new Map();
        this.CLICK_RATE_LIMIT = 10;
        this.RATE_LIMIT_WINDOW = 60000;
    }
    afterInit(server) {
        this.logger.log("🚀 Enhanced Unified Hospital WebSocket Gateway initialized with robust click handling");
        server.use((socket, next) => {
            var _a;
            this.logger.log(`🔌 Socket middleware: ${socket.id} from ${socket.handshake.address}`);
            this.logger.log(`📋 Connection details:`, {
                id: socket.id,
                transport: socket.conn.transport.name,
                address: socket.handshake.address,
                userAgent: socket.handshake.headers["user-agent"],
                origin: socket.handshake.headers.origin,
            });
            try {
                const token = socket.handshake.auth.token || ((_a = socket.handshake.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]);
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
        server.on("connection_error", (err) => {
            this.logger.error(`❌ Connection error: ${err.message}`);
        });
        this.logger.log("✅ Unified WebSocket server ready with enhanced click validation");
        this.logger.log(`🌐 Features: Location validation (30km), Rate limiting, Surge detection`);
    }
    handleConnection(client) {
        this.logger.log(`🔗 Client connected to unified gateway: ${client.id}`);
        const sessionId = `session_${client.id}_${Date.now()}`;
        this.clientSessions.set(client.id, sessionId);
        if (!this.clientRooms.has(client.id)) {
            this.clientRooms.set(client.id, new Set());
        }
        if (!this.clientChannels.has(client.id)) {
            this.clientChannels.set(client.id, new Set());
        }
        this.clickRateLimit.set(sessionId, { count: 0, resetTime: Date.now() + this.RATE_LIMIT_WINDOW });
        client.emit("connection_status", {
            connected: true,
            clientId: client.id,
            sessionId,
            timestamp: new Date().toISOString(),
            transport: client.conn.transport.name,
            message: "Connected to enhanced hospital monitoring system with robust click handling",
            modules: ["surge", "bedspace", "hospital-clicks", "general"],
            authenticated: client.data.authenticated || false,
            clickValidation: {
                locationValidation: true,
                radiusKm: 30,
                rateLimit: this.CLICK_RATE_LIMIT,
                rateLimitWindowMs: this.RATE_LIMIT_WINDOW,
                surgeWindowMinutes: 30,
            },
        });
        client.emit("welcome", {
            message: "Welcome to the Enhanced Unified Hospital Monitoring System",
            clientId: client.id,
            sessionId,
            timestamp: new Date().toISOString(),
            modules: ["surge", "bedspace", "hospital-clicks", "general"],
            availableEvents: [
                "hospital-click",
                "get-hospital-click-stats",
                "get-surge-history",
                "subscribe_hospital_clicks",
                "reset-hospital-clicks",
                "subscribe_hospital_surges",
                "subscribe_regional_surges",
                "create_surge",
                "subscribe_hospital",
                "updateBedSpace",
                "get_initial_bedspace_data",
                "subscribe_channel",
                "get_connection_stats",
                "ping",
            ],
        });
        this.setupHeartbeat(client, sessionId);
        this.logger.log(`📊 Total connected clients: ${this.server.sockets.sockets.size}`);
        client.broadcast.emit("client_connected", {
            clientId: client.id,
            sessionId,
            timestamp: new Date().toISOString(),
            totalClients: this.server.sockets.sockets.size,
        });
    }
    handleDisconnect(client) {
        this.logger.log(`❌ Client disconnected from unified gateway: ${client.id}`);
        const sessionId = this.clientSessions.get(client.id);
        if (client.data.heartbeatInterval) {
            clearInterval(client.data.heartbeatInterval);
        }
        this.clientSessions.delete(client.id);
        if (sessionId) {
            this.clickRateLimit.delete(sessionId);
        }
        this.cleanupClientSubscriptions(client.id);
        this.logger.log(`📊 Total connected clients: ${this.server.sockets.sockets.size}`);
    }
    async handleHospitalClick(data, client) {
        try {
            const { hospitalId, latitude, longitude, userAgent } = data;
            const sessionId = this.clientSessions.get(client.id);
            if (!sessionId) {
                throw new websockets_1.WsException("Session not found");
            }
            if (!hospitalId || latitude === undefined || longitude === undefined) {
                throw new websockets_1.WsException("Hospital ID, latitude, and longitude are required");
            }
            if (!this.checkRateLimit(sessionId)) {
                throw new websockets_1.WsException("Rate limit exceeded. Please wait before clicking again.");
            }
            this.logger.log(`🖱️ Hospital click received: ${hospitalId} from ${sessionId} at ${latitude}, ${longitude}`);
            const clickData = {
                hospitalId,
                sessionId,
                latitude,
                longitude,
                userAgent: userAgent || client.handshake.headers["user-agent"],
                ipAddress: client.handshake.address,
            };
            const result = await this.hospitalClicksService.handleClick(clickData);
            const clickUpdatePayload = {
                hospitalId,
                clickCount: result.clickCount,
                surgeTriggered: result.surgeTriggered,
                message: result.message,
                isValidLocation: result.isValidLocation,
                distanceFromHospital: result.distanceFromHospital,
                timestamp: new Date().toISOString(),
                sessionId,
                location: { latitude, longitude },
                hospitalInfo: result.hospitalInfo,
                validationInfo: {
                    radiusKm: 30,
                    withinRadius: result.isValidLocation,
                    distanceKm: Math.round(result.distanceFromHospital / 1000),
                },
                eventId: `click_${Date.now()}`,
            };
            await this.emitToHospitalRooms(hospitalId, "click-count-updated", clickUpdatePayload);
            await this.emitToHospitalRooms(hospitalId, "hospital-click-processed", clickUpdatePayload);
            if (result.isValidLocation) {
                await this.emitToRegionalSubscribers(hospitalId, "hospital-click-updated", clickUpdatePayload);
            }
            if (result.surgeTriggered && result.data) {
                await this.handleSurgeTriggered(result.data, clickUpdatePayload);
            }
            client.emit("hospital-click-response", {
                success: true,
                clickCount: result.clickCount,
                surgeTriggered: result.surgeTriggered,
                message: result.message,
                isValidLocation: result.isValidLocation,
                distanceFromHospital: result.distanceFromHospital,
                sessionId,
                timestamp: new Date().toISOString(),
            });
            return {
                success: true,
                clickCount: result.clickCount,
                surgeTriggered: result.surgeTriggered,
                message: result.message,
                isValidLocation: result.isValidLocation,
                distanceFromHospital: result.distanceFromHospital,
                sessionId,
            };
        }
        catch (error) {
            this.logger.error("Error handling hospital click:", error);
            client.emit("hospital-click-error", {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
            });
            return {
                success: false,
                error: error.message,
                isValidLocation: false,
            };
        }
    }
    async getHospitalClickStats(data, client) {
        try {
            const { hospitalId } = data;
            if (!hospitalId) {
                throw new websockets_1.WsException("Hospital ID is required");
            }
            const stats = await this.hospitalClicksService.getClickStatistics(hospitalId);
            const statsPayload = Object.assign(Object.assign({ hospitalId }, stats), { timestamp: new Date().toISOString(), eventId: `stats_${Date.now()}` });
            client.emit("hospital-click-stats", statsPayload);
            this.logger.log(`📊 Click stats sent for hospital ${hospitalId}`);
            return { success: true, stats: statsPayload };
        }
        catch (error) {
            this.logger.error("Error getting hospital click stats:", error);
            client.emit("hospital-click-stats-error", {
                error: error.message,
                timestamp: new Date().toISOString(),
            });
            return { success: false, error: error.message };
        }
    }
    async getSurgeHistory(data, client) {
        try {
            const { hospitalId, limit = 10 } = data;
            if (!hospitalId) {
                throw new websockets_1.WsException("Hospital ID is required");
            }
            const surgeHistory = await this.hospitalClicksService.getSurgeHistory(hospitalId, limit);
            const historyPayload = {
                hospitalId,
                surgeHistory,
                limit,
                timestamp: new Date().toISOString(),
                eventId: `history_${Date.now()}`,
            };
            client.emit("surge-history", historyPayload);
            this.logger.log(`📜 Surge history sent for hospital ${hospitalId} (${surgeHistory.length} records)`);
            return { success: true, history: historyPayload };
        }
        catch (error) {
            this.logger.error("Error getting surge history:", error);
            client.emit("surge-history-error", {
                error: error.message,
                timestamp: new Date().toISOString(),
            });
            return { success: false, error: error.message };
        }
    }
    async handleSubscribeHospitalClicks(client, payload) {
        try {
            const { hospitalId } = payload;
            if (!hospitalId) {
                throw new websockets_1.WsException("Hospital ID is required");
            }
            this.logger.log(`🖱️ Client ${client.id} subscribing to hospital clicks ${hospitalId}`);
            const roomName = `hospital:${hospitalId}:clicks`;
            await client.join(roomName);
            this.updateClientTracking(client.id, hospitalId);
            const stats = await this.hospitalClicksService.getClickStatistics(hospitalId);
            const initialData = Object.assign(Object.assign({ hospitalId }, stats), { locationValidation: {
                    enabled: true,
                    radiusKm: 30,
                    surgeWindowMinutes: 30,
                }, timestamp: new Date().toISOString(), eventId: `initial_clicks_${Date.now()}` });
            client.emit("hospital-clicks-data", initialData);
            client.emit("hospital-clicks-subscription-confirmed", {
                hospitalId,
                success: true,
                roomName,
                timestamp: new Date().toISOString(),
            });
            this.logger.log(`✅ Client ${client.id} subscribed to hospital clicks ${hospitalId}`);
            return {
                success: true,
                message: `Subscribed to hospital clicks ${hospitalId}`,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`❌ Error subscribing to hospital clicks: ${error.message}`);
            throw new websockets_1.WsException(`Failed to subscribe to clicks: ${error.message}`);
        }
    }
    async resetHospitalClicks(data, client) {
        var _a;
        try {
            const { hospitalId, adminToken } = data;
            if (!hospitalId) {
                throw new websockets_1.WsException("Hospital ID is required");
            }
            if (!this.verifyAdminAccess(client, adminToken)) {
                throw new websockets_1.WsException("Admin access required for reset operation");
            }
            this.logger.log(`🔄 Resetting hospital clicks for ${hospitalId}`);
            await this.hospitalClicksService.resetClicks(hospitalId);
            const resetPayload = {
                hospitalId,
                clickCount: 0,
                surgeTriggered: false,
                message: "Hospital clicks reset successfully",
                timestamp: new Date().toISOString(),
                eventId: `reset_${Date.now()}`,
                resetBy: ((_a = client.data.user) === null || _a === void 0 ? void 0 : _a.id) || "anonymous",
            };
            await this.emitToHospitalRooms(hospitalId, "click-count-updated", resetPayload);
            await this.emitToHospitalRooms(hospitalId, "hospital-clicks-reset", resetPayload);
            this.logger.log(`✅ Hospital clicks reset for ${hospitalId}`);
            return { success: true, message: "Hospital clicks reset successfully" };
        }
        catch (error) {
            this.logger.error("Error resetting hospital clicks:", error);
            return { success: false, error: error.message };
        }
    }
    async handleSubscribeHospitalSurges(client, payload) {
        try {
            const { hospitalId } = payload;
            if (!hospitalId) {
                throw new websockets_1.WsException("Hospital ID is required");
            }
            this.logger.log(`🏥 Client ${client.id} subscribing to hospital surges ${hospitalId}`);
            const roomName = `hospital:${hospitalId}:surges`;
            await client.join(roomName);
            this.updateClientTracking(client.id, hospitalId);
            await this.sendCurrentSurgeData(client, hospitalId);
            client.emit("hospital_subscription_confirmed", {
                hospitalId,
                success: true,
                timestamp: new Date().toISOString(),
                locationValidation: true,
            });
            this.logger.log(`✅ Client ${client.id} successfully subscribed to hospital surges ${hospitalId}`);
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
    async handleSubscribeHospital(client, payload) {
        try {
            const { hospitalId } = payload;
            if (!hospitalId) {
                throw new websockets_1.WsException("Hospital ID is required");
            }
            this.logger.log(`🏥 Client ${client.id} subscribing to hospital bedspace ${hospitalId}`);
            const roomName = `hospital:${hospitalId}:bedspace`;
            await client.join(roomName);
            this.updateClientTracking(client.id, hospitalId);
            await this.sendCurrentBedspaceData(client, hospitalId);
            return {
                success: true,
                message: `Subscribed to hospital bedspace ${hospitalId}`,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`❌ Error subscribing to hospital bedspace: ${error.message}`);
            throw new websockets_1.WsException(`Failed to subscribe: ${error.message}`);
        }
    }
    async handleUpdateBedSpace(client, payload) {
        try {
            const { unitId, availableBeds, hospitalId } = payload;
            this.logger.log(`🛏️ Updating bed space via WebSocket: unitId=${unitId}, availableBeds=${availableBeds}`);
            const bedspace = await this.bedspaceModel.findById(unitId);
            if (!bedspace) {
                throw new websockets_1.WsException("Bedspace not found");
            }
            bedspace.availableBeds = availableBeds;
            bedspace.occupiedBeds = bedspace.totalBeds - availableBeds;
            const updatedBedspace = await bedspace.save();
            const eventPayload = {
                hospitalId: hospitalId || bedspace.hospital.toString(),
                bedspace: updatedBedspace.toObject(),
                timestamp: new Date().toISOString(),
                eventId: `bedspace_update_${Date.now()}`,
            };
            const roomName = `hospital:${eventPayload.hospitalId}:bedspace`;
            this.server.to(roomName).emit("bedspace_updated", eventPayload);
            this.server.to(roomName).emit("bedSpaceUpdated", eventPayload);
            this.eventEmitter.emit("bedspace.updated", eventPayload);
            this.logger.log(`✅ Bedspace updated and emitted: ${updatedBedspace._id}`);
            return {
                success: true,
                message: "Bedspace updated successfully",
                data: updatedBedspace.toObject(),
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`❌ Error updating bedspace: ${error.message}`);
            throw new websockets_1.WsException(`Failed to update bedspace: ${error.message}`);
        }
    }
    async handleLocationValidatedSurgeTriggered(surgeData) {
        try {
            this.logger.log(`🚨 LOCATION-VALIDATED SURGE TRIGGERED for hospital ${surgeData.hospitalId}`);
            this.logger.log(`📍 Contributing locations: ${surgeData.contributingClicks.length} unique locations`);
            this.logger.log(`🎯 Average click location: ${surgeData.averageClickLocation.latitude}, ${surgeData.averageClickLocation.longitude}`);
            const newSurge = new this.surgeModel({
                hospital: surgeData.hospitalId,
                latitude: surgeData.averageClickLocation.latitude,
                longitude: surgeData.averageClickLocation.longitude,
                emergencyType: "location_validated_high_demand",
                description: `Location-validated surge triggered by ${surgeData.clickCount} clicks from ${surgeData.metadata.totalUniqueSessions} unique sessions within 30km radius`,
                metadata: Object.assign(Object.assign({}, surgeData.metadata), { clickCount: surgeData.clickCount, triggerType: "location_validated_click_threshold", hospitalLocation: {
                        latitude: surgeData.hospitalInfo.latitude,
                        longitude: surgeData.hospitalInfo.longitude,
                    }, contributingClicks: surgeData.contributingClicks, averageClickLocation: surgeData.averageClickLocation, locationValidation: {
                        radiusKm: 30,
                        allClicksValidated: true,
                        minDistanceKm: Math.round(surgeData.metadata.minDistanceFromHospital / 1000),
                        maxDistanceKm: Math.round(surgeData.metadata.maxDistanceFromHospital / 1000),
                    } }),
                status: "active",
            });
            const savedSurge = await newSurge.save();
            const eventPayload = {
                hospitalId: surgeData.hospitalId,
                surge: savedSurge.toObject(),
                triggerData: surgeData,
                timestamp: new Date().toISOString(),
                eventId: `location_validated_surge_${Date.now()}`,
                locationsMap: surgeData.contributingClicks.map((click) => ({
                    sessionId: click.sessionId,
                    coordinates: [click.longitude, click.latitude],
                    distanceFromHospitalKm: Math.round(click.distanceFromHospital / 1000),
                    timestamp: click.timestamp,
                })),
                hospitalLocation: {
                    coordinates: [surgeData.hospitalInfo.longitude, surgeData.hospitalInfo.latitude],
                },
                averageClickLocation: {
                    coordinates: [surgeData.averageClickLocation.longitude, surgeData.averageClickLocation.latitude],
                },
            };
            await this.emitToHospitalRooms(surgeData.hospitalId, "surge_created", eventPayload);
            await this.emitToHospitalRooms(surgeData.hospitalId, "location-validated-surge-created", eventPayload);
            await this.emitToHospitalRooms(surgeData.hospitalId, "hospital-click-threshold-reached", eventPayload);
            await this.emitToRegionalSubscribers(surgeData.hospitalId, "surge_created", eventPayload);
            await this.emitToRegionalSubscribers(surgeData.hospitalId, "location-validated-surge-created", eventPayload);
            this.server.emit("global_location_validated_surge_created", eventPayload);
            this.eventEmitter.emit("surge.created", eventPayload);
            this.logger.log(`✅ Location-validated surge created and broadcasted: ${savedSurge._id}`);
        }
        catch (error) {
            this.logger.error(`❌ Error handling location-validated surge trigger: ${error.message}`, error.stack);
        }
    }
    handlePing(client) {
        this.logger.log(`🏓 Ping received from client ${client.id}`);
        return { event: "pong", data: { timestamp: new Date().toISOString() } };
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
            clientChannels: this.clientChannels.get(client.id) || new Set(),
            sessionId: this.clientSessions.get(client.id),
            clickValidation: {
                locationValidation: true,
                radiusKm: 30,
                rateLimit: this.CLICK_RATE_LIMIT,
                rateLimitWindowMs: this.RATE_LIMIT_WINDOW,
            },
            timestamp: new Date().toISOString(),
        };
        client.emit("connection_stats", stats);
        return stats;
    }
    setupHeartbeat(client, sessionId) {
        client.emit("heartbeat", {
            timestamp: new Date().toISOString(),
            message: "Initial heartbeat",
        });
        const interval = setInterval(() => {
            if (client.connected) {
                client.emit("heartbeat", {
                    timestamp: new Date().toISOString(),
                    clientId: client.id,
                    sessionId,
                });
            }
            else {
                clearInterval(interval);
            }
        }, 30000);
        client.data.heartbeatInterval = interval;
    }
    checkRateLimit(sessionId) {
        const now = Date.now();
        const rateData = this.clickRateLimit.get(sessionId);
        if (!rateData) {
            this.clickRateLimit.set(sessionId, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW });
            return true;
        }
        if (now > rateData.resetTime) {
            this.clickRateLimit.set(sessionId, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW });
            return true;
        }
        if (rateData.count >= this.CLICK_RATE_LIMIT) {
            return false;
        }
        rateData.count++;
        return true;
    }
    updateClientTracking(clientId, hospitalId) {
        if (!this.connectedClients.has(hospitalId)) {
            this.connectedClients.set(hospitalId, new Set());
        }
        this.connectedClients.get(hospitalId).add(clientId);
        if (!this.clientRooms.has(clientId)) {
            this.clientRooms.set(clientId, new Set());
        }
        this.clientRooms.get(clientId).add(hospitalId);
    }
    cleanupClientSubscriptions(clientId) {
        if (this.clientRooms.has(clientId)) {
            const rooms = this.clientRooms.get(clientId);
            rooms.forEach((room) => {
                if (this.connectedClients.has(room)) {
                    this.connectedClients.get(room).delete(clientId);
                }
            });
            this.clientRooms.delete(clientId);
        }
        if (this.clientChannels.has(clientId)) {
            this.clientChannels.delete(clientId);
        }
    }
    async emitToHospitalRooms(hospitalId, eventName, payload) {
        const hospitalRooms = [
            `hospital:${hospitalId}:clicks`,
            `hospital:${hospitalId}:surges`,
            `hospital:${hospitalId}:bedspace`,
        ];
        hospitalRooms.forEach((room) => {
            this.server.to(room).emit(eventName, payload);
        });
    }
    async handleSurgeTriggered(surgeData, clickPayload) {
        this.logger.log(`🚨 Location-validated surge triggered by click for hospital ${surgeData.hospitalId}`);
        const surgeNotification = Object.assign(Object.assign({}, clickPayload), { surgeData, eventType: "location_validated_surge", timestamp: new Date().toISOString() });
        await this.emitToHospitalRooms(surgeData.hospitalId, "location-validated-surge-triggered", surgeNotification);
        await this.emitToRegionalSubscribers(surgeData.hospitalId, "surge-triggered-by-clicks", surgeNotification);
    }
    verifyAdminAccess(client, adminToken) {
        return client.data.authenticated || false;
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
                this.logger.log(`📤 Sent ${surges.length} initial surges for hospital ${hospitalId}`);
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
                this.logger.log(`📤 Sent ${surges.length} initial regional surges`);
            }
        }
        catch (error) {
            this.logger.error(`❌ Error sending current regional surge data: ${error.message}`);
        }
    }
    async sendCurrentBedspaceData(client, hospitalId) {
        try {
            let query;
            if (this.isValidObjectId(hospitalId)) {
                query = {
                    $or: [{ hospital: new mongoose_2.Types.ObjectId(hospitalId) }, { hospital: hospitalId }],
                };
            }
            else {
                query = { hospital: hospitalId };
            }
            const bedspaces = await this.bedspaceModel.find(query).maxTimeMS(5000).exec();
            if (bedspaces.length > 0) {
                client.emit("initial_bedspace_data", {
                    hospitalId,
                    bedspaces,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            this.logger.error(`❌ Error sending current bedspace data: ${error.message}`);
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
    async emitToRegionalSubscribers(hospitalId, eventName, payload) {
        try {
            const hospital = await this.hospitalModel.findById(hospitalId).exec();
            if (!hospital || !hospital.latitude || !hospital.longitude) {
                this.logger.warn(`⚠️ Hospital ${hospitalId} not found or missing coordinates`);
                return;
            }
            const regionRooms = Array.from(this.server.sockets.adapter.rooms.keys()).filter((room) => room.startsWith("region:"));
            let emittedCount = 0;
            for (const room of regionRooms) {
                try {
                    const [, latStr, lngStr, radiusStr] = room.split(":");
                    const regionLat = Number.parseFloat(latStr);
                    const regionLng = Number.parseFloat(lngStr);
                    const radius = Number.parseFloat(radiusStr) * 1000;
                    const distance = this.calculateDistance(regionLat, regionLng, hospital.latitude, hospital.longitude);
                    if (distance <= radius) {
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
    isValidObjectId(id) {
        if (!id || typeof id !== "string") {
            return false;
        }
        return mongoose_2.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", Function)
], UnifiedHospitalGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)("hospital-click"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], UnifiedHospitalGateway.prototype, "handleHospitalClick", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("get-hospital-click-stats"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], UnifiedHospitalGateway.prototype, "getHospitalClickStats", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("get-surge-history"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], UnifiedHospitalGateway.prototype, "getSurgeHistory", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("subscribe_hospital_clicks"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], UnifiedHospitalGateway.prototype, "handleSubscribeHospitalClicks", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("reset-hospital-clicks"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], UnifiedHospitalGateway.prototype, "resetHospitalClicks", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("subscribe_hospital_surges"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], UnifiedHospitalGateway.prototype, "handleSubscribeHospitalSurges", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("subscribe_regional_surges"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], UnifiedHospitalGateway.prototype, "handleSubscribeRegionalSurges", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("subscribe_hospital"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], UnifiedHospitalGateway.prototype, "handleSubscribeHospital", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("updateBedSpace"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], UnifiedHospitalGateway.prototype, "handleUpdateBedSpace", null);
__decorate([
    (0, event_emitter_1.OnEvent)("hospital.surge.triggered"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UnifiedHospitalGateway.prototype, "handleLocationValidatedSurgeTriggered", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("ping"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], UnifiedHospitalGateway.prototype, "handlePing", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("get_connection_stats"),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], UnifiedHospitalGateway.prototype, "handleGetConnectionStats", null);
UnifiedHospitalGateway = __decorate([
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
    __param(3, (0, mongoose_1.InjectModel)(hospital_schema_1.Hospital.name)),
    __param(4, (0, mongoose_1.InjectModel)(bedspace_schema_1.Bedspace.name)),
    __param(5, (0, mongoose_1.InjectModel)(surge_schema_1.Surge.name)),
    __param(6, (0, mongoose_1.InjectModel)(hospital_click_schema_1.HospitalClick.name)),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2,
        jwt_1.JwtService,
        hospital_clicks_service_1.HospitalClicksService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], UnifiedHospitalGateway);
exports.UnifiedHospitalGateway = UnifiedHospitalGateway;
//# sourceMappingURL=unified-hospital.gateway.js.map