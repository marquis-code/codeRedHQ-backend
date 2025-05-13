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
    (0, mongoose_1.Prop)({
        type: mongoose_2.Schema.Types.Mixed,
        ref: 'Hospital',
        required: true,
        validate: {
            validator: function (v) {
                return typeof v === 'string' || v instanceof mongoose_2.Types.ObjectId;
            },
            message: props => `${props.value} is not a valid hospital identifier!`
        }
    }),
    __metadata("design:type", Object)
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
const getHospitalModel = function () {
    try {
        if (mongoose_3.default.modelNames().includes('Hospital')) {
            return mongoose_3.default.model('Hospital');
        }
        const connection = mongoose_3.default.connection;
        if (connection && connection.models && connection.models.Hospital) {
            return connection.models.Hospital;
        }
        console.error('Hospital model not available: Schema hasn\'t been registered for model "Hospital".');
        return null;
    }
    catch (error) {
        console.error('Hospital model not available:', error.message);
        return null;
    }
};
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
const findHospitalById = async function (hospitalId) {
    try {
        const HospitalModel = getHospitalModel();
        if (!HospitalModel) {
            console.log('Hospital model not available, skipping update');
            return null;
        }
        const hospitalIdStr = typeof hospitalId === 'object' && hospitalId !== null
            ? hospitalId.toString()
            : hospitalId;
        if (typeof hospitalIdStr !== 'string') {
            console.error('Invalid hospital ID format:', hospitalId);
            return null;
        }
        let hospital;
        if (/^[0-9a-fA-F]{24}$/.test(hospitalIdStr)) {
            hospital = await HospitalModel.findById(hospitalIdStr)
                .maxTimeMS(5000)
                .exec();
        }
        if (!hospital) {
            hospital = await HospitalModel.findOne({ placeId: hospitalIdStr })
                .maxTimeMS(5000)
                .exec();
        }
        return hospital;
    }
    catch (error) {
        console.error('Error finding hospital:', error);
        return null;
    }
};
exports.BedspaceSchema.post('save', async function () {
    const bedspace = this;
    try {
        setTimeout(async () => {
            try {
                const hospital = await findHospitalById(bedspace.hospital);
                if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
                    await hospital.updateBedspaceSummary();
                }
                else if (hospital) {
                    console.log(`updateBedspaceSummary method not available for hospital: ${hospital._id}`);
                }
            }
            catch (error) {
                console.error('Error updating hospital after bedspace save (delayed):', error);
            }
        }, 1000);
    }
    catch (error) {
        console.error('Error updating hospital after bedspace save:', error);
    }
});
exports.BedspaceSchema.post('findOneAndUpdate', async function (doc) {
    if (doc) {
        try {
            setTimeout(async () => {
                try {
                    const hospital = await findHospitalById(doc.hospital);
                    if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
                        await hospital.updateBedspaceSummary();
                    }
                    else if (hospital) {
                        console.log(`updateBedspaceSummary method not available for hospital: ${hospital._id}`);
                    }
                }
                catch (error) {
                    console.error('Error updating hospital after bedspace update (delayed):', error);
                }
            }, 1000);
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
            const HospitalModel = getHospitalModel.call(this);
            if (!HospitalModel) {
                console.log('Hospital model not available, skipping update');
                return;
            }
            let hospitalId = bedspace.hospital;
            if (typeof hospitalId === 'object' && hospitalId !== null) {
                hospitalId = hospitalId.toString();
            }
            if (typeof hospitalId !== 'string') {
                console.error('Invalid hospital ID format:', hospitalId);
                return;
            }
            let hospital;
            if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
                hospital = await HospitalModel.findById(hospitalId);
            }
            if (!hospital) {
                hospital = await HospitalModel.findOne({ placeId: hospitalId });
            }
            if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
                await hospital.updateBedspaceSummary();
            }
            else {
                console.log(`Hospital not found or updateBedspaceSummary not available for ID: ${hospitalId}`);
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
            const hospitalId = typeof bedspace.hospital === 'object' && bedspace.hospital !== null
                ? bedspace.hospital.toString()
                : bedspace.hospital;
            this.options = this.options || {};
            this.options._operationId = operationId;
            this.options._hospitalId = hospitalId;
        }
    }
    catch (error) {
        console.error('Error in pre findOneAndDelete:', error);
    }
});
exports.BedspaceSchema.post('findOneAndDelete', async function () {
    var _a;
    try {
        const hospitalId = (_a = this.options) === null || _a === void 0 ? void 0 : _a._hospitalId;
        if (hospitalId) {
            const HospitalModel = getHospitalModel.call(this);
            if (!HospitalModel) {
                console.log('Hospital model not available, skipping update');
                return;
            }
            let hospital;
            if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
                hospital = await HospitalModel.findById(hospitalId);
            }
            if (!hospital) {
                hospital = await HospitalModel.findOne({ placeId: hospitalId });
            }
            if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
                await hospital.updateBedspaceSummary();
            }
            else {
                console.log(`Hospital not found or updateBedspaceSummary not available for ID: ${hospitalId}`);
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
            const hospitalIds = [...new Set(bedspaces.map(b => {
                    if (!b.hospital)
                        return null;
                    return typeof b.hospital === 'object' && b.hospital !== null
                        ? b.hospital.toString()
                        : b.hospital;
                }).filter(id => id !== null))];
            if (hospitalIds.length > 0) {
                this.options = this.options || {};
                this.options._hospitalIds = hospitalIds;
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
        const hospitalIds = ((_a = this.options) === null || _a === void 0 ? void 0 : _a._hospitalIds) || [];
        if (hospitalIds.length > 0) {
            const HospitalModel = getHospitalModel.call(this);
            if (!HospitalModel) {
                console.log('Hospital model not available, skipping update');
                return;
            }
            for (const hospitalId of hospitalIds) {
                let hospital;
                if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
                    hospital = await HospitalModel.findById(hospitalId);
                }
                if (!hospital) {
                    hospital = await HospitalModel.findOne({ placeId: hospitalId });
                }
                if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
                    await hospital.updateBedspaceSummary();
                }
                else {
                    console.log(`Hospital not found or updateBedspaceSummary not available for ID: ${hospitalId}`);
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
        const HospitalModel = getHospitalModel.call(this);
        if (!HospitalModel) {
            console.log('Hospital model not available, skipping update');
            return false;
        }
        let hospital;
        if (/^[0-9a-fA-F]{24}$/.test(hospitalId)) {
            hospital = await HospitalModel.findById(hospitalId);
        }
        if (!hospital) {
            hospital = await HospitalModel.findOne({ placeId: hospitalId });
        }
        if (hospital && typeof hospital.updateBedspaceSummary === 'function') {
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