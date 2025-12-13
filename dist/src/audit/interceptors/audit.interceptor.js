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
        const { action, resourceType, includeRequestBody = true, includeResponseData = true } = auditOptions;
        const previousState = auditOptions.getPreviousState
            ? auditOptions.getPreviousState(request)
            : null;
        return next.handle().pipe((0, operators_1.tap)(async (response) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
            try {
                const hospitalId = ((_a = request.user) === null || _a === void 0 ? void 0 : _a.hospitalId) ||
                    ((_b = request.params) === null || _b === void 0 ? void 0 : _b.hospitalId) ||
                    ((_c = request.body) === null || _c === void 0 ? void 0 : _c.hospital) ||
                    ((_d = request.query) === null || _d === void 0 ? void 0 : _d.hospitalId);
                const staffId = ((_e = request.user) === null || _e === void 0 ? void 0 : _e.sub) ||
                    ((_f = request.user) === null || _f === void 0 ? void 0 : _f.id) ||
                    ((_g = request.user) === null || _g === void 0 ? void 0 : _g._id) ||
                    ((_h = request.params) === null || _h === void 0 ? void 0 : _h.staffId) ||
                    ((_j = request.body) === null || _j === void 0 ? void 0 : _j.staffId);
                if (!hospitalId || !staffId) {
                    console.warn('Audit log skipped: Missing required IDs', {
                        hospitalId: !!hospitalId,
                        staffId: !!staffId,
                        action,
                        resourceType,
                        path: request.url
                    });
                    return;
                }
                let resourceId;
                if (auditOptions.getResourceId) {
                    resourceId = auditOptions.getResourceId(request, response);
                }
                else {
                    resourceId =
                        ((_k = request.params) === null || _k === void 0 ? void 0 : _k.id) ||
                            ((_l = response === null || response === void 0 ? void 0 : response.data) === null || _l === void 0 ? void 0 : _l._id) ||
                            (response === null || response === void 0 ? void 0 : response._id) ||
                            ((_m = response === null || response === void 0 ? void 0 : response.data) === null || _m === void 0 ? void 0 : _m.id) ||
                            (response === null || response === void 0 ? void 0 : response.id);
                }
                let newState;
                if (auditOptions.getNewState) {
                    newState = auditOptions.getNewState(request, response);
                }
                else if (includeResponseData) {
                    newState = (response === null || response === void 0 ? void 0 : response.data) || response;
                }
                else {
                    newState = { status: 'completed' };
                }
                if (typeof newState !== 'object' || newState === null) {
                    newState = { value: newState };
                }
                const ipAddress = request.ip ||
                    ((_p = (_o = request.headers['x-forwarded-for']) === null || _o === void 0 ? void 0 : _o.split(',')[0]) === null || _p === void 0 ? void 0 : _p.trim()) ||
                    ((_q = request.connection) === null || _q === void 0 ? void 0 : _q.remoteAddress) ||
                    ((_r = request.socket) === null || _r === void 0 ? void 0 : _r.remoteAddress);
                const userAgent = request.headers['user-agent'];
                const location = ((_s = request.body) === null || _s === void 0 ? void 0 : _s.location) || ((_t = request.query) === null || _t === void 0 ? void 0 : _t.location);
                const metadata = {
                    method: request.method,
                    url: request.url,
                    endpoint: `${request.method} ${((_u = request.route) === null || _u === void 0 ? void 0 : _u.path) || request.url}`,
                    params: request.params,
                    query: request.query,
                    timestamp: new Date().toISOString(),
                };
                if (request.user) {
                    metadata.user = {
                        id: request.user.sub || request.user.id,
                        email: request.user.email,
                        role: request.user.role,
                        permissions: request.user.permissions,
                    };
                }
                if (includeRequestBody && request.body) {
                    const sanitizedBody = Object.assign({}, request.body);
                    delete sanitizedBody.password;
                    delete sanitizedBody.token;
                    delete sanitizedBody.refreshToken;
                    metadata.requestBody = sanitizedBody;
                }
                await this.auditService.createLog({
                    hospital: hospitalId,
                    staff: staffId,
                    action,
                    resourceType,
                    resourceId: resourceId || undefined,
                    previousState: previousState || undefined,
                    newState,
                    metadata,
                    notes: auditOptions.notes,
                    location: location ? {
                        latitude: location.latitude,
                        longitude: location.longitude,
                    } : undefined,
                    status: 'success',
                    ipAddress,
                    userAgent,
                });
                console.log(`Audit log created: ${action} on ${resourceType}`, {
                    hospitalId,
                    staffId,
                    resourceId,
                });
            }
            catch (error) {
                console.error('Error creating audit log:', {
                    error: error.message,
                    stack: error.stack,
                    action: auditOptions.action,
                    resourceType: auditOptions.resourceType,
                    url: request.url,
                });
            }
        }), (0, operators_1.tap)(null, async (error) => {
            var _a, _b, _c, _d;
            try {
                const hospitalId = ((_a = request.user) === null || _a === void 0 ? void 0 : _a.hospitalId) || ((_b = request.params) === null || _b === void 0 ? void 0 : _b.hospitalId);
                const staffId = ((_c = request.user) === null || _c === void 0 ? void 0 : _c.sub) || ((_d = request.user) === null || _d === void 0 ? void 0 : _d.id);
                if (hospitalId && staffId) {
                    await this.auditService.createLog({
                        hospital: hospitalId,
                        staff: staffId,
                        action: auditOptions.action,
                        resourceType: auditOptions.resourceType,
                        previousState: previousState || undefined,
                        metadata: {
                            method: request.method,
                            url: request.url,
                            error: {
                                message: error.message,
                                statusCode: error.status || 500,
                            },
                        },
                        status: 'failed',
                        ipAddress: request.ip,
                        userAgent: request.headers['user-agent'],
                        notes: `Action failed: ${error.message}`,
                    });
                }
            }
            catch (auditError) {
                console.error('Error logging failed action audit:', auditError);
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