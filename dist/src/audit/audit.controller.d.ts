import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(hospitalId: string, query: any): Promise<{
        data: import("./schemas/audit.schema").AuditLog[];
        total: number;
        page: number;
        limit: number;
    }>;
    getActivitySummary(hospitalId: string, days: number): Promise<any>;
    findOne(id: string): Promise<import("./schemas/audit.schema").AuditLog>;
}
