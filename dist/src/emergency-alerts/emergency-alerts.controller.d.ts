import { EmergencyAlertsService } from './emergency-alerts.service';
import { CreateEmergencyAlertDto } from './dto/create-emergency-alert.dto';
import { UpdateEmergencyAlertDto } from './dto/update-emergency-alert.dto';
import { EmergencyAlert } from './schemas/emergency-alerts.schema';
export declare class EmergencyAlertsController {
    private readonly emergencyAlertsService;
    constructor(emergencyAlertsService: EmergencyAlertsService);
    create(createEmergencyAlertDto: CreateEmergencyAlertDto): Promise<EmergencyAlert>;
    findAll(hospitalId?: string, status?: string): Promise<EmergencyAlert[]>;
    findOne(id: string): Promise<EmergencyAlert>;
    update(id: string, updateEmergencyAlertDto: UpdateEmergencyAlertDto): Promise<EmergencyAlert>;
    remove(id: string): Promise<void>;
    resolveAlert(id: string, resolvedBy: string): Promise<EmergencyAlert>;
    getActiveAlertCount(hospitalId: string): Promise<{
        count: number;
    }>;
    getAlertsByType(hospitalId: string, startDateStr?: string, endDateStr?: string): Promise<any>;
}
