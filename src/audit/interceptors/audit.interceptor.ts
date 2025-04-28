import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { Reflector } from '@nestjs/core';
  import { AuditService } from '../audit.service';
  
  export const AUDIT_KEY = 'audit';
  
  export interface AuditOptions {
    module: string;
    action: string;
    getResourceId?: (request: any, response: any) => any;
    getPreviousState?: (request: any) => any;
    getNewState?: (request: any, response: any) => any;
  }
  
  export const Audit = (options: AuditOptions) => {
    return (target: any, key: string, descriptor: PropertyDescriptor) => {
      Reflect.defineMetadata(AUDIT_KEY, options, target, key);
      return descriptor;
    };
  };
  
  @Injectable()
  export class AuditInterceptor implements NestInterceptor {
    constructor(
      private readonly reflector: Reflector,
      private readonly auditService: AuditService,
    ) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const auditOptions = this.reflector.get<AuditOptions>(
        AUDIT_KEY,
        context.getHandler(),
      );
  
      if (!auditOptions) {
        return next.handle();
      }
  
      const request = context.switchToHttp().getRequest();
      const { module, action } = auditOptions;
      const previousState = auditOptions.getPreviousState
        ? auditOptions.getPreviousState(request)
        : null;
  
      return next.handle().pipe(
        tap(async (response) => {
          try {
            const hospitalId = request.user?.sub || request.params?.hospitalId;
            
            if (!hospitalId) {
              return;
            }
  
            const resourceId = auditOptions.getResourceId
              ? auditOptions.getResourceId(request, response)
              : request.params?.id;
  
            const newState = auditOptions.getNewState
              ? auditOptions.getNewState(request, response)
              : request.body;
  
            await this.auditService.logActivity(
              hospitalId,
              module,
              action,
              resourceId,
              previousState,
              newState,
              request,
            );
          } catch (error) {
            console.error('Error logging audit activity:', error);
          }
        }),
      );
    }
  }