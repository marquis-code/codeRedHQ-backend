"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const hospital_schema_1 = require("../hospital/schemas/hospital.schema");
const hospital_migration_service_1 = require("./services/hospital-migration.service");
const migrate_hospitals_command_1 = require("./commands/migrate-hospitals.command");
let MigrationsModule = class MigrationsModule {
};
MigrationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: hospital_schema_1.Hospital.name, schema: hospital_schema_1.HospitalSchema },
            ]),
        ],
        providers: [hospital_migration_service_1.HospitalMigrationService, migrate_hospitals_command_1.MigrateHospitalsCommand],
        exports: [hospital_migration_service_1.HospitalMigrationService],
    })
], MigrationsModule);
exports.MigrationsModule = MigrationsModule;
//# sourceMappingURL=migrations.module.js.map