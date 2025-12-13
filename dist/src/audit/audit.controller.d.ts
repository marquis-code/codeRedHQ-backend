import { AuditService, CreateAuditLogDto } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    createLog(createAuditLogDto: CreateAuditLogDto): Promise<{
        success: boolean;
        message: string;
        data: import("./schemas/audit.schema").AuditLogDocument;
    }>;
    getHospitalLogs(hospitalId: string, startDate?: string, endDate?: string, action?: string, resourceType?: string, staffId?: string, limit?: string, skip?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            logs: import("./schemas/audit.schema").AuditLogDocument[];
            total: number;
            limit: any;
            skip: any;
            hasMore: boolean;
        };
    }>;
    getResourceHistory(resourceType: string, resourceId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            resourceType: string;
            resourceId: string;
            totalRecords: number;
            history: import("./schemas/audit.schema").AuditLogDocument[];
        };
    }>;
    getStaffActivity(staffId: string, startDate?: string, endDate?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            staffId: string;
            totalActivities: number;
            activities: import("./schemas/audit.schema").AuditLogDocument[];
        };
    }>;
    getActivitySummary(hospitalId: string, startDate: string, endDate: string): Promise<{
        success: boolean;
        message: string;
        data: {
            hospitalId: string;
            period: {
                startDate: Date;
                endDate: Date;
            };
            summary: any;
        };
    }>;
}
