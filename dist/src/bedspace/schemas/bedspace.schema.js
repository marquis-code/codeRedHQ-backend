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
exports.BedspaceSchema = exports.Bedspace = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const mongoose_3 = require("mongoose");
let Bedspace = class Bedspace {
};
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Hospital', required: true }),
    __metadata("design:type", mongoose_3.Types.ObjectId)
], Bedspace.prototype, "hospital", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Bedspace.prototype, "departmentName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Bedspace.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Bedspace.prototype, "totalBeds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], Bedspace.prototype, "availableBeds", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0 }),
    __metadata("design:type", Number)
], Bedspace.prototype, "occupiedBeds", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Bedspace.prototype, "lastUpdated", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['Available', 'Limited', 'Unavailable'], default: 'Available' }),
    __metadata("design:type", String)
], Bedspace.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ date: Date, available: Number, occupied: Number }], default: [] }),
    __metadata("design:type", Array)
], Bedspace.prototype, "history", void 0);
Bedspace = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Bedspace);
exports.Bedspace = Bedspace;
exports.BedspaceSchema = mongoose_1.SchemaFactory.createForClass(Bedspace);
exports.BedspaceSchema.pre('save', function (next) {
    const bedspace = this;
    bedspace.lastUpdated = new Date();
    const occupancyPercentage = (bedspace.occupiedBeds / bedspace.totalBeds) * 100;
    if (bedspace.availableBeds === 0) {
        bedspace.status = 'Unavailable';
    }
    else if (occupancyPercentage >= 80) {
        bedspace.status = 'Limited';
    }
    else {
        bedspace.status = 'Available';
    }
    bedspace.history.push({
        date: new Date(),
        available: bedspace.availableBeds,
        occupied: bedspace.occupiedBeds
    });
    if (bedspace.history.length > 100) {
        bedspace.history = bedspace.history.slice(-100);
    }
    next();
});
//# sourceMappingURL=bedspace.schema.js.map