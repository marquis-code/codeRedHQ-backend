import { Model } from 'mongoose';
import { BedspaceDocument } from '../bedspace/schemas/bedspace.schema';
import { EmergencyAlertDocument } from '../emergency-alerts/schemas/emergency-alerts.schema';
import { StaffDocument } from '../staffing/schemas/staff.schema';
export declare class ReportsService {
    private bedspaceModel;
    private emergencyAlertModel;
    private staffModel;
    constructor(bedspaceModel: Model<BedspaceDocument>, emergencyAlertModel: Model<EmergencyAlertDocument>, staffModel: Model<StaffDocument>);
    getBedOccupancyTrends(hospitalId: string, startDate: Date, endDate: Date): Promise<any>;
    getEmergencyAlertsTrends(hospitalId: string, startDate: Date, endDate: Date): Promise<any>;
    getStaffAvailabilityTrends(hospitalId: string, startDate: Date, endDate: Date): Promise<any>;
    getDashboardSummary(hospitalId: string): Promise<any>;
}
