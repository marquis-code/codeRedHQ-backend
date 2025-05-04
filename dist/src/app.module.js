"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const event_emitter_1 = require("@nestjs/event-emitter");
const auth_module_1 = require("./auth/auth.module");
const hospital_module_1 = require("./hospital/hospital.module");
const user_module_1 = require("./user/user.module");
const bedspace_module_1 = require("./bedspace/bedspace.module");
const staff_module_1 = require("./staffing/staff.module");
const emergency_alerts_module_1 = require("./emergency-alerts/emergency-alerts.module");
const reports_module_1 = require("./reports/reports.module");
const map_module_1 = require("./map/map.module");
const websocket_module_1 = require("./websocket/websocket.module");
const audit_module_1 = require("./audit/audit.module");
const surge_module_1 = require("./surge/surge.module");
const database_module_1 = require("./database/database.module");
const migrations_module_1 = require("./migrations/migrations.module");
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', `.env.${process.env.NODE_ENV || 'development'}`],
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => ({
                    uri: configService.get('MONGO_URL'),
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                }),
            }),
            event_emitter_1.EventEmitterModule.forRoot({
                wildcard: true,
                maxListeners: 20,
                verboseMemoryLeak: true,
            }),
            auth_module_1.AuthModule,
            database_module_1.DatabaseModule,
            hospital_module_1.HospitalModule,
            bedspace_module_1.BedspaceModule,
            staff_module_1.StaffingModule,
            emergency_alerts_module_1.EmergencyAlertsModule,
            reports_module_1.ReportsModule,
            map_module_1.MapModule,
            websocket_module_1.WebsocketModule,
            audit_module_1.AuditModule,
            user_module_1.UserModule,
            surge_module_1.SurgeModule,
            migrations_module_1.MigrationsModule,
        ],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map