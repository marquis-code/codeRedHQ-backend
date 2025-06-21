"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalClicksModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const event_emitter_1 = require("@nestjs/event-emitter");
const hospital_click_schema_1 = require("./schemas/hospital-click.schema");
const hospital_schema_1 = require("../hospital/schemas/hospital.schema");
const hospital_clicks_service_1 = require("./hospital-clicks.service");
const hospital_clicks_gateway_1 = require("../websocket/gateways/hospital-clicks.gateway");
let HospitalClicksModule = class HospitalClicksModule {
};
HospitalClicksModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: hospital_click_schema_1.HospitalClick.name, schema: hospital_click_schema_1.HospitalClickSchema },
                { name: hospital_schema_1.Hospital.name, schema: hospital_schema_1.HospitalSchema },
            ]),
            event_emitter_1.EventEmitterModule,
        ],
        providers: [hospital_clicks_service_1.HospitalClicksService, hospital_clicks_gateway_1.HospitalClicksGateway],
        exports: [hospital_clicks_service_1.HospitalClicksService, hospital_clicks_gateway_1.HospitalClicksGateway],
    })
], HospitalClicksModule);
exports.HospitalClicksModule = HospitalClicksModule;
//# sourceMappingURL=hospital-clicks.module.js.map