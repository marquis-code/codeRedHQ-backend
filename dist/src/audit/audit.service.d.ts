import { Model, Types } from 'mongoose';
import { AuditLogDocument } from './schemas/audit.schema';
export interface CreateAuditLogDto {
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
export declare class AuditService {
    private auditLogModel;
    constructor(auditLogModel: Model<AuditLogDocument>);
    createLog(logData: CreateAuditLogDto): Promise<AuditLogDocument>;
    getHospitalLogs(hospitalId: string, options?: {
        startDate?: Date;
        endDate?: Date;
        action?: string;
        resourceType?: string;
        staffId?: string;
        limit?: number;
        skip?: number;
    }): Promise<{
        logs: AuditLogDocument[];
        total: number;
    }>;
    getResourceHistory(resourceType: string, resourceId: string): Promise<AuditLogDocument[]>;
    getStaffActivity(staffId: string, startDate?: Date, endDate?: Date): Promise<AuditLogDocument[]>;
    getActivitySummary(hospitalId: string, startDate: Date, endDate: Date): Promise<any>;
}
