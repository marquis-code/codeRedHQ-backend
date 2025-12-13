import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const Permissions: (...permissions: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare class PermissionGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
