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
exports.HospitalClicksGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const hospital_clicks_service_1 = require("../../hospital-click/hospital-clicks.service");
let HospitalClicksGateway = class HospitalClicksGateway {
    constructor(hospitalClicksService) {
        this.hospitalClicksService = hospitalClicksService;
    }
    async handleHospitalClick(data, client) {
        try {
            const { hospitalId, sessionId, latitude, longitude, userAgent } = data;
            const clickData = {
                hospitalId,
                sessionId,
                latitude: latitude || 0,
                longitude: longitude || 0,
                userAgent: userAgent || client.handshake.headers["user-agent"],
                ipAddress: client.handshake.address,
            };
            const result = await this.hospitalClicksService.handleClick(clickData);
            this.server.emit("click-count-updated", {
                hospitalId,
                clickCount: result.clickCount,
                surgeTriggered: result.surgeTriggered,
                isValidLocation: result.isValidLocation,
                message: result.message,
            });
            if (result.surgeTriggered) {
                this.server.emit("hospital-click-threshold-reached", {
                    hospitalId,
                    clickCount: result.clickCount,
                    message: `Hospital ${hospitalId} has reached the surge threshold!`,
                    surgeData: result.data,
                });
            }
            return {
                success: true,
                clickCount: result.clickCount,
                surgeTriggered: result.surgeTriggered,
                isValidLocation: result.isValidLocation,
                message: result.message,
            };
        }
        catch (error) {
            console.error("Error handling hospital click:", error);
            return { success: false, error: error.message };
        }
    }
    async getHospitalClicks(data, client) {
        try {
            const stats = await this.hospitalClicksService.getClickStatistics(data.hospitalId);
            client.emit("hospital-clicks-data", {
                hospitalId: data.hospitalId,
                clickCount: stats.currentClickCount || 0,
                totalSurgesTriggered: stats.totalSurgesTriggered || 0,
                totalValidClicks: stats.totalValidClicks || 0,
                totalInvalidClicks: stats.totalInvalidClicks || 0,
                status: stats.status || "active",
                lastClickTime: stats.lastClickTime,
                lastSurgeTime: stats.lastSurgeTime,
            });
        }
        catch (error) {
            console.error("Error getting hospital clicks:", error);
            client.emit("hospital-clicks-error", { error: error.message });
        }
    }
    async resetHospitalClicks(data, client) {
        try {
            await this.hospitalClicksService.resetClicks(data.hospitalId);
            this.server.emit("click-count-updated", {
                hospitalId: data.hospitalId,
                clickCount: 0,
                surgeTriggered: false,
                message: "Hospital clicks have been reset",
            });
            return { success: true };
        }
        catch (error) {
            console.error("Error resetting hospital clicks:", error);
            return { success: false, error: error.message };
        }
    }
    async getSurgeHistory(data, client) {
        try {
            const surgeHistory = await this.hospitalClicksService.getSurgeHistory(data.hospitalId, data.limit || 10);
            client.emit("surge-history", {
                hospitalId: data.hospitalId,
                surgeHistory,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error("Error getting surge history:", error);
            client.emit("surge-history-error", { error: error.message });
        }
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], HospitalClicksGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)("hospital-click"),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], HospitalClicksGateway.prototype, "handleHospitalClick", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("get-hospital-clicks"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], HospitalClicksGateway.prototype, "getHospitalClicks", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("reset-hospital-clicks"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], HospitalClicksGateway.prototype, "resetHospitalClicks", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("get-surge-history"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], HospitalClicksGateway.prototype, "getSurgeHistory", null);
HospitalClicksGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            methods: ["GET", "POST"],
        },
    }),
    __metadata("design:paramtypes", [hospital_clicks_service_1.HospitalClicksService])
], HospitalClicksGateway);
exports.HospitalClicksGateway = HospitalClicksGateway;
//# sourceMappingURL=hospital-clicks.gateway.js.map