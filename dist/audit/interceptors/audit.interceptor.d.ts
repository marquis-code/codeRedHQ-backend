import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../audit.service';
export declare const AUDIT_KEY = "audit";
export interface AuditOptions {
    module: string;
    action: string;
    getResourceId?: (request: any, response: any) => any;
    getPreviousState?: (request: any) => any;
    getNewState?: (request: any, response: any) => any;
}
export declare const Audit: (options: AuditOptions) => (target: any, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare class AuditInterceptor implements NestInterceptor {
    private readonly reflector;
    private readonly auditService;
    constructor(reflector: Reflector, auditService: AuditService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
