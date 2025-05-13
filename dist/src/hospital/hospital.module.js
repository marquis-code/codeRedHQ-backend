"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const event_emitter_1 = require("@nestjs/event-emitter");
const hospital_controller_1 = require("./hospital.controller");
const hospital_service_1 = require("./hospital.service");
const hospital_schema_1 = require("./schemas/hospital.schema");
const auth_module_1 = require("../auth/auth.module");
let HospitalModule = class HospitalModule {
};
HospitalModule = __decorate([
    (0, common_1.Module)({
        imports: [
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
            mongoose_1.MongooseModule.forFeature([
                { name: hospital_schema_1.Hospital.name, schema: hospital_schema_1.HospitalSchema, collection: 'hospitals' },
            ]),
            event_emitter_1.EventEmitterModule.forRoot(),
        ],
        controllers: [hospital_controller_1.HospitalController],
        providers: [hospital_service_1.HospitalService],
        exports: [hospital_service_1.HospitalService, mongoose_1.MongooseModule],
    })
], HospitalModule);
exports.HospitalModule = HospitalModule;
//# sourceMappingURL=hospital.module.js.map