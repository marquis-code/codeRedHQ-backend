"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = exports.Audit = exports.AUDIT_KEY = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const core_1 = require("@nestjs/core");
const audit_service_1 = require("../audit.service");
exports.AUDIT_KEY = 'audit';
const Audit = (options) => {
    return (target, key, descriptor) => {
        Reflect.defineMetadata(exports.AUDIT_KEY, options, target, key);
        return descriptor;
    };
};
exports.Audit = Audit;
let AuditInterceptor = class AuditInterceptor {
    constructor(reflector, auditService) {
        this.reflector = reflector;
        this.auditService = auditService;
    }
    intercept(context, next) {
        const auditOptions = this.reflector.get(exports.AUDIT_KEY, context.getHandler());
        if (!auditOptions) {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const { module, action } = auditOptions;
        const previousState = auditOptions.getPreviousState
            ? auditOptions.getPreviousState(request)
            : null;
        return next.handle().pipe((0, operators_1.tap)(async (response) => {
            var _a, _b, _c;
            try {
                const hospitalId = ((_a = request.user) === null || _a === void 0 ? void 0 : _a.sub) || ((_b = request.params) === null || _b === void 0 ? void 0 : _b.hospitalId);
                if (!hospitalId) {
                    return;
                }
                const resourceId = auditOptions.getResourceId
                    ? auditOptions.getResourceId(request, response)
                    : (_c = request.params) === null || _c === void 0 ? void 0 : _c.id;
                const newState = auditOptions.getNewState
                    ? auditOptions.getNewState(request, response)
                    : request.body;
                await this.auditService.logActivity(hospitalId, module, action, resourceId, previousState, newState, request);
            }
            catch (error) {
                console.error('Error logging audit activity:', error);
            }
        }));
    }
};
AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        audit_service_1.AuditService])
], AuditInterceptor);
exports.AuditInterceptor = AuditInterceptor;
//# sourceMappingURL=audit.interceptor.js.map