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
exports.StaffSchema = exports.Staff = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcrypt");
let Staff = class Staff {
};
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Hospital', required: true }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], Staff.prototype, "hospital", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Staff.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Staff.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Staff.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Staff.prototype, "position", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Staff.prototype, "department", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['Available', 'Unavailable', 'On Shift', 'Off Shift'], default: 'Off Shift' }),
    __metadata("design:type", String)
], Staff.prototype, "availability", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Staff.prototype, "contactNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ date: Date, shift: String, status: String }], default: [] }),
    __metadata("design:type", Array)
], Staff.prototype, "schedule", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Staff.prototype, "specializations", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], Staff.prototype, "attendanceHistory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], Staff.prototype, "currentShift", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Staff.prototype, "permissions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['none', 'read', 'write', 'admin'], default: 'none' }),
    __metadata("design:type", String)
], Staff.prototype, "emrAccessLevel", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Staff.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Staff.prototype, "isVerified", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    }),
    __metadata("design:type", Object)
], Staff.prototype, "lastKnownLocation", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Staff.prototype, "lastLocationUpdate", void 0);
Staff = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Staff);
exports.Staff = Staff;
exports.StaffSchema = mongoose_1.SchemaFactory.createForClass(Staff);
exports.StaffSchema.index({ lastKnownLocation: '2dsphere' });
exports.StaffSchema.index({ hospital: 1, email: 1 }, { unique: true });
exports.StaffSchema.pre('save', async function (next) {
    const staff = this;
    if (!staff.isModified('password'))
        return next();
    try {
        const salt = await bcrypt.genSalt(10);
        staff.password = await bcrypt.hash(staff.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.StaffSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
//# sourceMappingURL=staff.schema.js.map