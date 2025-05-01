import { Model } from 'mongoose';
import { Request } from 'express';
import { AuditLog, AuditLogDocument } from './schemas/audit.schema';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
interface AuthenticatedRequest extends Request {
    user?: {
        hospitalName?: string;
        [key: string]: any;
    };
}
export declare class AuditService {
    private readonly auditLogModel;
    constructor(auditLogModel: Model<AuditLogDocument>);
    create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog>;
    findAll(hospitalId: string, query?: any): Promise<{
        data: AuditLog[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<AuditLog>;
    logActivity(hospitalId: string, module: string, action: string, resourceId: any, previousState?: any, newState?: any, req?: AuthenticatedRequest): Promise<void>;
    getActivitySummary(hospitalId: string, days?: number): Promise<any>;
}
export {};
