import { Types } from 'mongoose';
export declare class CreateAuditLogDto {
    hospital: Types.ObjectId | string;
    staff: Types.ObjectId | string;
    action: string;
    resourceType: string;
    resourceId?: Types.ObjectId | string;
    previousState?: Record<string, any>;
    newState?: Record<string, any>;
    metadata?: Record<string, any>;
    notes?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    status?: string;
    ipAddress?: string;
    userAgent?: string;
}
