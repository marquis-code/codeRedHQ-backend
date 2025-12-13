"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMRModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const emr_controller_1 = require("./emr.controller");
const emr_service_1 = require("./emr.service");
const emr_schema_1 = require("./schemas/emr.schema");
const emr_schema_2 = require("./schemas/emr.schema");
const emr_schema_3 = require("./schemas/emr.schema");
const staff_schema_1 = require("../staffing/schemas/staff.schema");
const bedspace_schema_1 = require("../bedspace/schemas/bedspace.schema");
const audit_module_1 = require("../audit/audit.module");
let EMRModule = class EMRModule {
};
EMRModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: emr_schema_1.Patient.name, schema: emr_schema_1.PatientSchema },
                { name: emr_schema_2.MedicalVisit.name, schema: emr_schema_2.MedicalVisitSchema },
                { name: emr_schema_3.SurgeData.name, schema: emr_schema_3.SurgeDataSchema },
                { name: staff_schema_1.Staff.name, schema: staff_schema_1.StaffSchema },
                { name: bedspace_schema_1.Bedspace.name, schema: bedspace_schema_1.BedspaceSchema },
            ]),
            audit_module_1.AuditModule,
        ],
        controllers: [emr_controller_1.EMRController],
        providers: [emr_service_1.EMRService],
        exports: [emr_service_1.EMRService],
    })
], EMRModule);
exports.EMRModule = EMRModule;
//# sourceMappingURL=emr.module.js.map