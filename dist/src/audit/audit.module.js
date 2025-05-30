"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const audit_service_1 = require("./audit.service");
const audit_controller_1 = require("./audit.controller");
const audit_schema_1 = require("./schemas/audit.schema");
const audit_interceptor_1 = require("./interceptors/audit.interceptor");
let AuditModule = class AuditModule {
};
AuditModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: audit_schema_1.AuditLog.name, schema: audit_schema_1.AuditLogSchema },
            ]),
        ],
        controllers: [audit_controller_1.AuditController],
        providers: [audit_service_1.AuditService, audit_interceptor_1.AuditInterceptor],
        exports: [audit_service_1.AuditService],
    })
], AuditModule);
exports.AuditModule = AuditModule;
//# sourceMappingURL=audit.module.js.map