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
exports.HospitalSchema = exports.Hospital = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcrypt");
let Hospital = class Hospital {
};
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Hospital.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Hospital.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Hospital.prototype, "placeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Hospital.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Hospital.prototype, "hospitalName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Hospital.prototype, "contactInformation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Hospital.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Hospital.prototype, "website", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], Hospital.prototype, "operatingHours", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Hospital.prototype, "facilityType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Hospital.prototype, "availableSpecialties", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Hospital.prototype, "emergencyServices", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Hospital.prototype, "capacity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], Hospital.prototype, "emergencyEquipment", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Hospital.prototype, "emergencyContactNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Hospital.prototype, "emergencyDepartment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Object], default: [] }),
    __metadata("design:type", Array)
], Hospital.prototype, "doctorOnDutyContact", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Hospital.prototype, "acceptedInsuranceProviders", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Hospital.prototype, "emergencyPaymentPolicies", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Hospital.prototype, "expectedResponseTime", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Hospital.prototype, "dedicatedPointOfContact", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Hospital.prototype, "communicationProtocols", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Hospital.prototype, "airAmbulance", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Hospital.prototype, "telemedicineServices", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], Hospital.prototype, "latitude", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number }),
    __metadata("design:type", Number)
], Hospital.prototype, "longitude", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }),
    __metadata("design:type", Object)
], Hospital.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [{
                _id: { type: mongoose_2.Schema.Types.ObjectId, ref: 'Bedspace' },
                departmentName: String,
                location: String,
                totalBeds: Number,
                availableBeds: Number,
                occupiedBeds: Number,
                status: {
                    type: String,
                    enum: ['Available', 'Limited', 'Unavailable'],
                    default: 'Available'
                },
                lastUpdated: Date
            }],
        default: []
    }),
    __metadata("design:type", Array)
], Hospital.prototype, "bedspacesSummary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Hospital.prototype, "totalBedCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Hospital.prototype, "totalAvailableBeds", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['Available', 'Limited', 'Unavailable'],
        default: 'Available'
    }),
    __metadata("design:type", String)
], Hospital.prototype, "overallBedStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Hospital.prototype, "isActive", void 0);
Hospital = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
], Hospital);
exports.Hospital = Hospital;
exports.HospitalSchema = mongoose_1.SchemaFactory.createForClass(Hospital);
exports.HospitalSchema.index({ location: '2dsphere' });
exports.HospitalSchema.virtual('bedspaces', {
    ref: 'Bedspace',
    localField: '_id',
    foreignField: 'hospital',
    justOne: false
});
exports.HospitalSchema.pre('save', async function (next) {
    const hospital = this;
    if (hospital.latitude && hospital.longitude) {
        hospital.location = {
            type: 'Point',
            coordinates: [hospital.longitude, hospital.latitude]
        };
    }
    if (!hospital.isModified('password'))
        return next();
    try {
        const salt = await bcrypt.genSalt(10);
        hospital.password = await bcrypt.hash(hospital.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.HospitalSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
exports.HospitalSchema.methods.updateBedspaceSummary = async function () {
    const hospital = this;
    try {
        const BedspaceModel = (0, mongoose_2.model)('Bedspace');
        const bedspaces = await BedspaceModel.find({ hospital: hospital._id });
        hospital.bedspacesSummary = bedspaces.map(b => ({
            _id: b._id,
            departmentName: b.departmentName,
            location: b.location,
            totalBeds: b.totalBeds,
            availableBeds: b.availableBeds,
            occupiedBeds: b.occupiedBeds,
            status: b.status,
            lastUpdated: b.lastUpdated
        }));
        hospital.totalBedCount = bedspaces.reduce((sum, b) => sum + b.totalBeds, 0);
        hospital.totalAvailableBeds = bedspaces.reduce((sum, b) => sum + b.availableBeds, 0);
        if (hospital.totalBedCount === 0) {
            hospital.overallBedStatus = 'Available';
        }
        else if (hospital.totalAvailableBeds === 0) {
            hospital.overallBedStatus = 'Unavailable';
        }
        else if (hospital.totalAvailableBeds / hospital.totalBedCount < 0.2) {
            hospital.overallBedStatus = 'Limited';
        }
        else {
            hospital.overallBedStatus = 'Available';
        }
        await hospital.save();
    }
    catch (error) {
        console.error('Error updating bedspace summary:', error);
        throw error;
    }
};
//# sourceMappingURL=hospital.schema.js.map