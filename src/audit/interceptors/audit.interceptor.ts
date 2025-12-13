// import {
//     Injectable,
//     NestInterceptor,
//     ExecutionContext,
//     CallHandler,
//   } from '@nestjs/common';
//   import { Observable } from 'rxjs';
//   import { tap } from 'rxjs/operators';
//   import { Reflector } from '@nestjs/core';
//   import { AuditService } from '../audit.service';
  
//   export const AUDIT_KEY = 'audit';
  
//   export interface AuditOptions {
//     module: string;
//     action: string;
//     getResourceId?: (request: any, response: any) => any;
//     getPreviousState?: (request: any) => any;
//     getNewState?: (request: any, response: any) => any;
//   }
  
//   export const Audit = (options: AuditOptions) => {
//     return (target: any, key: string, descriptor: PropertyDescriptor) => {
//       Reflect.defineMetadata(AUDIT_KEY, options, target, key);
//       return descriptor;
//     };
//   };
  
//   @Injectable()
//   export class AuditInterceptor implements NestInterceptor {
//     constructor(
//       private readonly reflector: Reflector,
//       private readonly auditService: AuditService,
//     ) {}
  
//     intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//       const auditOptions = this.reflector.get<AuditOptions>(
//         AUDIT_KEY,
//         context.getHandler(),
//       );
  
//       if (!auditOptions) {
//         return next.handle();
//       }
  
//       const request = context.switchToHttp().getRequest();
//       const { module, action } = auditOptions;
//       const previousState = auditOptions.getPreviousState
//         ? auditOptions.getPreviousState(request)
//         : null;
  
//       return next.handle().pipe(
//         tap(async (response) => {
//           try {
//             const hospitalId = request.user?.sub || request.params?.hospitalId;
            
//             if (!hospitalId) {
//               return;
//             }
  
//             const resourceId = auditOptions.getResourceId
//               ? auditOptions.getResourceId(request, response)
//               : request.params?.id;
  
//             const newState = auditOptions.getNewState
//               ? auditOptions.getNewState(request, response)
//               : request.body;
  
//             await this.auditService.logActivity(
//               hospitalId,
//               module,
//               action,
//               resourceId,
//               previousState,
//               newState,
//               request,
//             );
//           } catch (error) {
//             console.error('Error logging audit activity:', error);
//           }
//         }),
//       );
//     }
//   }

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
  action: string;
  resourceType: string;
  getResourceId?: (request: any, response: any) => any;
  getPreviousState?: (request: any) => any;
  getNewState?: (request: any, response: any) => any;
  includeRequestBody?: boolean;
  includeResponseData?: boolean;
  notes?: string;
}

/**
 * Decorator to enable audit logging for a controller method
 * @param options - Audit configuration options
 * 
 * @example
 * ```typescript
 * @Audit({
 *   action: 'bedspace_update',
 *   resourceType: 'Bedspace',
 *   getResourceId: (req, res) => res._id,
 *   getPreviousState: (req) => req.previousState,
 * })
 * @Put(':id')
 * async update(@Param('id') id: string) {
 *   // Your implementation
 * }
 * ```
 */
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

    // Skip if no audit options are defined
    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { action, resourceType, includeRequestBody = true, includeResponseData = true } = auditOptions;
    
    // Capture previous state before executing the handler
    const previousState = auditOptions.getPreviousState
      ? auditOptions.getPreviousState(request)
      : null;

    return next.handle().pipe(
      tap(async (response) => {
        try {
          // Extract hospital ID from various sources
          const hospitalId = 
            request.user?.hospitalId || 
            request.params?.hospitalId || 
            request.body?.hospital ||
            request.query?.hospitalId;
          
          // Extract staff ID from authenticated user (JWT payload)
          const staffId = 
            request.user?.sub || 
            request.user?.id || 
            request.user?._id ||
            request.params?.staffId ||
            request.body?.staffId;

          // Skip audit if required IDs are missing
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

          // Extract resource ID
          let resourceId;
          if (auditOptions.getResourceId) {
            resourceId = auditOptions.getResourceId(request, response);
          } else {
            resourceId = 
              request.params?.id || 
              response?.data?._id || 
              response?._id ||
              response?.data?.id ||
              response?.id;
          }

          // Extract new state
          let newState;
          if (auditOptions.getNewState) {
            newState = auditOptions.getNewState(request, response);
          } else if (includeResponseData) {
            newState = response?.data || response;
          } else {
            newState = { status: 'completed' };
          }

          // Ensure newState is an object
          if (typeof newState !== 'object' || newState === null) {
            newState = { value: newState };
          }

          // Extract IP address from various sources
          const ipAddress = 
            request.ip || 
            request.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
            request.connection?.remoteAddress ||
            request.socket?.remoteAddress;

          // Extract user agent
          const userAgent = request.headers['user-agent'];

          // Extract location if available (from request body or query)
          const location = request.body?.location || request.query?.location;

          // Build metadata
          const metadata: Record<string, any> = {
            method: request.method,
            url: request.url,
            endpoint: `${request.method} ${request.route?.path || request.url}`,
            params: request.params,
            query: request.query,
            timestamp: new Date().toISOString(),
          };

          // Add staff information from JWT if available
          if (request.user) {
            metadata.user = {
              id: request.user.sub || request.user.id,
              email: request.user.email,
              role: request.user.role,
              permissions: request.user.permissions,
            };
          }

          // Optionally include request body (excluding sensitive fields)
          if (includeRequestBody && request.body) {
            const sanitizedBody = { ...request.body };
            // Remove sensitive fields
            delete sanitizedBody.password;
            delete sanitizedBody.token;
            delete sanitizedBody.refreshToken;
            metadata.requestBody = sanitizedBody;
          }

          // Create audit log using the service
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

        } catch (error) {
          // Log the error but don't throw - audit logging should not break the main request
          console.error('Error creating audit log:', {
            error: error.message,
            stack: error.stack,
            action: auditOptions.action,
            resourceType: auditOptions.resourceType,
            url: request.url,
          });
        }
      }),
      // Handle errors in the main request flow
      tap(
        null,
        async (error) => {
          try {
            const hospitalId = request.user?.hospitalId || request.params?.hospitalId;
            const staffId = request.user?.sub || request.user?.id;

            if (hospitalId && staffId) {
              // Log failed actions
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
          } catch (auditError) {
            console.error('Error logging failed action audit:', auditError);
          }
        }
      ),
    );
  }
}