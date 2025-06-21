"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const hospital_schema_1 = require("../hospital/schemas/hospital.schema");
const bedspace_schema_1 = require("../bedspace/schemas/bedspace.schema");
const surge_schema_1 = require("../surge/schema/surge.schema");
const hospital_click_schema_1 = require("../hospital-click/schemas/hospital-click.schema");
const hospital_clicks_module_1 = require("../hospital-click/hospital-clicks.module");
const unified_hospital_gateway_1 = require("./gateways/unified-hospital.gateway");
let WebsocketModule = class WebsocketModule {
};
WebsocketModule = __decorate([
    (0, common_1.Module)({
        imports: [
            event_emitter_1.EventEmitterModule.forRoot(),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => ({
                    secret: configService.get("JWT_SECRET") || "your-secret-key",
                    signOptions: { expiresIn: "1d" },
                }),
            }),
            mongoose_1.MongooseModule.forFeature([
                { name: hospital_schema_1.Hospital.name, schema: hospital_schema_1.HospitalSchema },
                { name: bedspace_schema_1.Bedspace.name, schema: bedspace_schema_1.BedspaceSchema },
                { name: surge_schema_1.Surge.name, schema: surge_schema_1.SurgeSchema },
                { name: hospital_click_schema_1.HospitalClick.name, schema: hospital_click_schema_1.HospitalClickSchema }
            ]),
            hospital_clicks_module_1.HospitalClicksModule,
        ],
        providers: [unified_hospital_gateway_1.UnifiedHospitalGateway],
        exports: [unified_hospital_gateway_1.UnifiedHospitalGateway],
    })
], WebsocketModule);
exports.WebsocketModule = WebsocketModule;
//# sourceMappingURL=websocket.module.js.map