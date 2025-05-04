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
exports.HospitalMigrationService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const hospital_schema_1 = require("./schemas/hospital.schema");
let HospitalMigrationService = class HospitalMigrationService {
    constructor(hospitalModel) {
        this.hospitalModel = hospitalModel;
    }
    async migrateLocations() {
        try {
            const hospitals = await this.hospitalModel.find({
                latitude: { $exists: true },
                longitude: { $exists: true },
                $or: [
                    { location: { $exists: false } },
                    { 'location.type': { $exists: false } }
                ]
            }).exec();
            console.log(`Found ${hospitals.length} hospitals to update`);
            let updateCount = 0;
            for (const hospital of hospitals) {
                hospital.location = {
                    type: 'Point',
                    coordinates: [hospital.longitude, hospital.latitude]
                };
                await hospital.save();
                updateCount++;
                if (updateCount % 100 === 0) {
                    console.log(`Processed ${updateCount} hospitals so far...`);
                }
            }
            return {
                success: true,
                message: `Successfully updated ${updateCount} hospitals with GeoJSON location data`
            };
        }
        catch (error) {
            console.error('Error migrating hospital data:', error);
            return {
                success: false,
                message: `Migration failed: ${error.message}`
            };
        }
    }
};
HospitalMigrationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(hospital_schema_1.Hospital.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], HospitalMigrationService);
exports.HospitalMigrationService = HospitalMigrationService;
//# sourceMappingURL=hospital-migration.service.js.map