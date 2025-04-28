import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getBedOccupancyTrends(hospitalId: string, startDateStr: string, endDateStr: string): Promise<any>;
    getEmergencyAlertsTrends(hospitalId: string, startDateStr: string, endDateStr: string): Promise<any>;
    getStaffAvailabilityTrends(hospitalId: string, startDateStr: string, endDateStr: string): Promise<any>;
    getDashboardSummary(hospitalId: string): Promise<any>;
}
