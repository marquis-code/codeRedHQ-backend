"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const reports_controller_1 = require("./reports.controller");
const reports_service_1 = require("./reports.service");
const bedspace_schema_1 = require("../bedspace/schemas/bedspace.schema");
const emergency_alerts_schema_1 = require("../emergency-alerts/schemas/emergency-alerts.schema");
const staff_schema_1 = require("../staffing/schemas/staff.schema");
let ReportsModule = class ReportsModule {
};
ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: bedspace_schema_1.Bedspace.name, schema: bedspace_schema_1.BedspaceSchema },
                { name: emergency_alerts_schema_1.EmergencyAlert.name, schema: emergency_alerts_schema_1.EmergencyAlertSchema },
                { name: staff_schema_1.Staff.name, schema: staff_schema_1.StaffSchema },
            ]),
        ],
        controllers: [reports_controller_1.ReportsController],
        providers: [reports_service_1.ReportsService],
        exports: [reports_service_1.ReportsService],
    })
], ReportsModule);
exports.ReportsModule = ReportsModule;
//# sourceMappingURL=reports.module.js.map