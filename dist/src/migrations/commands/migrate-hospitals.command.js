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
exports.MigrateHospitalsCommand = void 0;
const nest_commander_1 = require("nest-commander");
const common_1 = require("@nestjs/common");
const hospital_migration_service_1 = require("../services/hospital-migration.service");
let MigrateHospitalsCommand = class MigrateHospitalsCommand extends nest_commander_1.CommandRunner {
    constructor(migrationService) {
        super();
        this.migrationService = migrationService;
    }
    async run() {
        console.log('🏥 Starting hospital location migration...');
        const result = await this.migrationService.migrateLocations();
        if (result.success) {
            console.log(`✅ ${result.message}`);
        }
        else {
            console.error(`❌ ${result.message}`);
            process.exit(1);
        }
        process.exit(0);
    }
};
MigrateHospitalsCommand = __decorate([
    (0, common_1.Injectable)(),
    (0, nest_commander_1.Command)({
        name: 'migrate:hospitals:location',
        description: 'Migrate existing hospitals to add GeoJSON location field'
    }),
    __metadata("design:paramtypes", [hospital_migration_service_1.HospitalMigrationService])
], MigrateHospitalsCommand);
exports.MigrateHospitalsCommand = MigrateHospitalsCommand;
//# sourceMappingURL=migrate-hospitals.command.js.map