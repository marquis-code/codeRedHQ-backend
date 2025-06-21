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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalClickSchema = exports.HospitalClick = exports.SurgeEventSchema = exports.SurgeEvent = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let SurgeEvent = class SurgeEvent {
};
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SurgeEvent.prototype, "surgeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], SurgeEvent.prototype, "triggeredAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], SurgeEvent.prototype, "clickCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                sessionId: String,
                latitude: Number,
                longitude: Number,
                timestamp: Date,
                distanceFromHospital: Number,
                userAgent: String,
                ipAddress: String,
            },
        ],
        required: true,
    }),
    __metadata("design:type", Array)
], SurgeEvent.prototype, "contributingClicks", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            latitude: Number,
            longitude: Number,
        },
        required: true,
    }),
    __metadata("design:type", Object)
], SurgeEvent.prototype, "averageClickLocation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], SurgeEvent.prototype, "timeToSurge", void 0);
SurgeEvent = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], SurgeEvent);
exports.SurgeEvent = SurgeEvent;
exports.SurgeEventSchema = mongoose_1.SchemaFactory.createForClass(SurgeEvent);
let HospitalClick = class HospitalClick {
};
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], HospitalClick.prototype, "hospitalId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            latitude: Number,
            longitude: Number,
        },
        required: true,
        index: "2dsphere",
    }),
    __metadata("design:type", Object)
], HospitalClick.prototype, "hospitalLocation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], HospitalClick.prototype, "currentClickCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], HospitalClick.prototype, "currentClickSessions", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                sessionId: String,
                latitude: Number,
                longitude: Number,
                timestamp: Date,
                distanceFromHospital: Number,
                userAgent: String,
                ipAddress: String,
                isValid: { type: Boolean, default: true },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], HospitalClick.prototype, "currentClickDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.SurgeEventSchema], default: [] }),
    __metadata("design:type", Array)
], HospitalClick.prototype, "surgeHistory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], HospitalClick.prototype, "lastClickTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], HospitalClick.prototype, "lastSurgeTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: "active" }),
    __metadata("design:type", String)
], HospitalClick.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], HospitalClick.prototype, "totalSurgesTriggered", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], HospitalClick.prototype, "totalValidClicks", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], HospitalClick.prototype, "totalInvalidClicks", void 0);
HospitalClick = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], HospitalClick);
exports.HospitalClick = HospitalClick;
exports.HospitalClickSchema = mongoose_1.SchemaFactory.createForClass(HospitalClick);
exports.HospitalClickSchema.index({ hospitalId: 1, lastClickTime: 1 });
exports.HospitalClickSchema.index({ hospitalId: 1, status: 1 });
exports.HospitalClickSchema.index({ hospitalLocation: "2dsphere" });
//# sourceMappingURL=hospital-click.schema.js.map