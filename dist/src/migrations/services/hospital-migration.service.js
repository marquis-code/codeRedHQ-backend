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
var HospitalMigrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalMigrationService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const hospital_schema_1 = require("../../hospital/schemas/hospital.schema");
let HospitalMigrationService = HospitalMigrationService_1 = class HospitalMigrationService {
    constructor(hospitalModel) {
        this.hospitalModel = hospitalModel;
        this.logger = new common_1.Logger(HospitalMigrationService_1.name);
    }
    async migrateLocations() {
        try {
            this.logger.log('Starting hospital location migration...');
            const hospitals = await this.hospitalModel.find({
                latitude: { $exists: true },
                longitude: { $exists: true },
                $or: [
                    { location: { $exists: false } },
                    { 'location.type': { $exists: false } }
                ]
            }).exec();
            this.logger.log(`Found ${hospitals.length} hospitals to update`);
            if (hospitals.length === 0) {
                return {
                    success: true,
                    message: 'No hospitals require migration - all records are up to date'
                };
            }
            let updateCount = 0;
            for (const hospital of hospitals) {
                hospital.location = {
                    type: 'Point',
                    coordinates: [hospital.longitude, hospital.latitude]
                };
                await hospital.save();
                updateCount++;
                if (updateCount % 100 === 0) {
                    this.logger.log(`Processed ${updateCount}/${hospitals.length} hospitals...`);
                }
            }
            this.logger.log(`Migration complete. Updated ${updateCount} hospitals`);
            return {
                success: true,
                message: `Successfully updated ${updateCount} hospitals with GeoJSON location data`
            };
        }
        catch (error) {
            this.logger.error(`Migration failed: ${error.message}`, error.stack);
            return {
                success: false,
                message: `Migration failed: ${error.message}`
            };
        }
    }
};
HospitalMigrationService = HospitalMigrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(hospital_schema_1.Hospital.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], HospitalMigrationService);
exports.HospitalMigrationService = HospitalMigrationService;
//# sourceMappingURL=hospital-migration.service.js.map