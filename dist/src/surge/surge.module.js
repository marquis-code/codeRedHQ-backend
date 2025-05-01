"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurgeModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const surge_schema_1 = require("./schema/surge.schema");
const surge_service_1 = require("./surge.service");
const surge_controller_1 = require("./surge.controller");
const hospital_schema_1 = require("../hospital/schemas/hospital.schema");
let SurgeModule = class SurgeModule {
};
SurgeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: surge_schema_1.Surge.name, schema: surge_schema_1.SurgeSchema },
                { name: hospital_schema_1.Hospital.name, schema: hospital_schema_1.HospitalSchema },
            ]),
        ],
        controllers: [surge_controller_1.SurgeController],
        providers: [surge_service_1.SurgeService],
        exports: [surge_service_1.SurgeService],
    })
], SurgeModule);
exports.SurgeModule = SurgeModule;
//# sourceMappingURL=surge.module.js.map