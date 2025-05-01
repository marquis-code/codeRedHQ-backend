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
exports.EmergencyAlertSchema = exports.EmergencyAlert = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let EmergencyAlert = class EmergencyAlert {
};
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Hospital', required: true }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], EmergencyAlert.prototype, "hospital", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], EmergencyAlert.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], EmergencyAlert.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['High', 'Moderate', 'Low'], default: 'Moderate' }),
    __metadata("design:type", String)
], EmergencyAlert.prototype, "severity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], EmergencyAlert.prototype, "startTime", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], EmergencyAlert.prototype, "endTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['Active', 'Resolved', 'Expired'], default: 'Active' }),
    __metadata("design:type", String)
], EmergencyAlert.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], EmergencyAlert.prototype, "affectedDepartment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], EmergencyAlert.prototype, "actions", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], EmergencyAlert.prototype, "resolvedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], EmergencyAlert.prototype, "resolvedAt", void 0);
EmergencyAlert = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], EmergencyAlert);
exports.EmergencyAlert = EmergencyAlert;
exports.EmergencyAlertSchema = mongoose_1.SchemaFactory.createForClass(EmergencyAlert);
//# sourceMappingURL=emergency-alerts.schema.js.map