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
const hospitalUpdateQueue = new Map();
exports.BedspaceSchema.pre('save', async function (next) {
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
exports.BedspaceSchema.post('save', async function () {
    const bedspace = this;
    try {
        const HospitalModel = (0, mongoose_2.model)('Hospital');
        const hospital = await HospitalModel.findById(bedspace.hospital);
        if (hospital) {
            await hospital.updateBedspaceSummary();
        }
    }
    catch (error) {
        console.error('Error updating hospital after bedspace save:', error);
    }
});
exports.BedspaceSchema.post('findOneAndUpdate', async function (doc) {
    if (doc) {
        try {
            const HospitalModel = (0, mongoose_2.model)('Hospital');
            const hospital = await HospitalModel.findById(doc.hospital);
            if (hospital) {
                await hospital.updateBedspaceSummary();
            }
        }
        catch (error) {
            console.error('Error updating hospital after bedspace update:', error);
        }
    }
});
exports.BedspaceSchema.pre('deleteOne', { document: true, query: false }, async function () {
    const bedspace = this;
    if (bedspace.hospital) {
        try {
            const HospitalModel = (0, mongoose_2.model)('Hospital');
            const hospital = await HospitalModel.findById(bedspace.hospital);
            if (hospital) {
                await hospital.updateBedspaceSummary();
            }
        }
        catch (error) {
            console.error('Error updating hospital after bedspace deletion:', error);
        }
    }
});
exports.BedspaceSchema.pre('findOneAndDelete', async function () {
    try {
        const bedspace = await this.model.findOne(this.getFilter());
        if (bedspace && bedspace.hospital) {
            const operationId = Date.now().toString() + Math.random().toString();
            hospitalUpdateQueue.set(operationId, [bedspace.hospital.toString()]);
            this.options = this.options || {};
            this.options._operationId = operationId;
        }
    }
    catch (error) {
        console.error('Error in pre findOneAndDelete:', error);
    }
});
exports.BedspaceSchema.post('findOneAndDelete', async function () {
    var _a;
    try {
        const operationId = (_a = this.options) === null || _a === void 0 ? void 0 : _a._operationId;
        if (operationId && hospitalUpdateQueue.has(operationId)) {
            const hospitalIds = hospitalUpdateQueue.get(operationId) || [];
            hospitalUpdateQueue.delete(operationId);
            const HospitalModel = (0, mongoose_2.model)('Hospital');
            for (const hospitalId of hospitalIds) {
                const hospital = await HospitalModel.findById(hospitalId);
                if (hospital) {
                    await hospital.updateBedspaceSummary();
                }
            }
        }
    }
    catch (error) {
        console.error('Error in post findOneAndDelete:', error);
    }
});
exports.BedspaceSchema.pre('deleteMany', async function () {
    try {
        const bedspaces = await this.model.find(this.getFilter(), 'hospital');
        if (bedspaces.length > 0) {
            const hospitalIds = [...new Set(bedspaces.map(b => b.hospital ? b.hospital.toString() : null).filter(id => id !== null))];
            if (hospitalIds.length > 0) {
                const operationId = Date.now().toString() + Math.random().toString();
                hospitalUpdateQueue.set(operationId, hospitalIds);
                this.options = this.options || {};
                this.options._operationId = operationId;
            }
        }
    }
    catch (error) {
        console.error('Error in pre deleteMany:', error);
    }
});
exports.BedspaceSchema.post('deleteMany', async function () {
    var _a;
    try {
        const operationId = (_a = this.options) === null || _a === void 0 ? void 0 : _a._operationId;
        if (operationId && hospitalUpdateQueue.has(operationId)) {
            const hospitalIds = hospitalUpdateQueue.get(operationId) || [];
            hospitalUpdateQueue.delete(operationId);
            const HospitalModel = (0, mongoose_2.model)('Hospital');
            for (const hospitalId of hospitalIds) {
                const hospital = await HospitalModel.findById(hospitalId);
                if (hospital) {
                    await hospital.updateBedspaceSummary();
                }
            }
        }
    }
    catch (error) {
        console.error('Error in post deleteMany:', error);
    }
});
exports.BedspaceSchema.statics.updateHospitalBedspaceSummary = async function (hospitalId) {
    try {
        const HospitalModel = (0, mongoose_2.model)('Hospital');
        const hospital = await HospitalModel.findById(hospitalId);
        if (hospital) {
            await hospital.updateBedspaceSummary();
            return true;
        }
        return false;
    }
    catch (error) {
        console.error('Error in updateHospitalBedspaceSummary:', error);
        return false;
    }
};
//# sourceMappingURL=bedspace.schema.js.map