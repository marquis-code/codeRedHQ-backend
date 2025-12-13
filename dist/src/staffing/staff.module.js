"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffingModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const staff_controller_1 = require("./staff.controller");
const staff_service_1 = require("./staff.service");
const staff_schema_1 = require("./schemas/staff.schema");
const hospital_schema_1 = require("../hospital/schemas/hospital.schema");
const audit_module_1 = require("../audit/audit.module");
let StaffingModule = class StaffingModule {
};
StaffingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            mongoose_1.MongooseModule.forFeature([
                { name: staff_schema_1.Staff.name, schema: staff_schema_1.StaffSchema },
                { name: hospital_schema_1.Hospital.name, schema: hospital_schema_1.HospitalSchema },
            ]),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: { expiresIn: '7d' },
                }),
            }),
            audit_module_1.AuditModule,
        ],
        controllers: [staff_controller_1.StaffingController],
        providers: [staff_service_1.StaffingService],
        exports: [staff_service_1.StaffingService, jwt_1.JwtModule],
    })
], StaffingModule);
exports.StaffingModule = StaffingModule;
//# sourceMappingURL=staff.module.js.map