import { Types } from 'mongoose';
export declare class CreateAuditLogDto {
    hospital: Types.ObjectId;
    module: string;
    action: string;
    resourceId?: any;
    previousState?: any;
    newState?: any;
    ipAddress?: string;
    userAgent?: string;
    performedBy?: string;
}
