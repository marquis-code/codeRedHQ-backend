"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyAlertsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const event_emitter_1 = require("@nestjs/event-emitter");
const emergency_alerts_service_1 = require("./emergency-alerts.service");
const emergency_alerts_controller_1 = require("./emergency-alerts.controller");
const emergency_alerts_schema_1 = require("./schemas/emergency-alerts.schema");
let EmergencyAlertsModule = class EmergencyAlertsModule {
};
EmergencyAlertsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: emergency_alerts_schema_1.EmergencyAlert.name, schema: emergency_alerts_schema_1.EmergencyAlertSchema },
            ]),
            event_emitter_1.EventEmitterModule.forRoot(),
        ],
        controllers: [emergency_alerts_controller_1.EmergencyAlertsController],
        providers: [emergency_alerts_service_1.EmergencyAlertsService],
        exports: [emergency_alerts_service_1.EmergencyAlertsService],
    })
], EmergencyAlertsModule);
exports.EmergencyAlertsModule = EmergencyAlertsModule;
//# sourceMappingURL=emergency-alerts.module.js.map