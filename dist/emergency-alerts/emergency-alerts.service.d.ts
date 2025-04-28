import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmergencyAlertDocument } from './schemas/emergency-alerts.schema';
import { CreateEmergencyAlertDto } from './dto/create-emergency-alert.dto';
import { UpdateEmergencyAlertDto } from './dto/update-emergency-alert.dto';
export declare class EmergencyAlertsService {
    private emergencyAlertModel;
    private eventEmitter;
    constructor(emergencyAlertModel: Model<EmergencyAlertDocument>, eventEmitter: EventEmitter2);
    create(createEmergencyAlertDto: CreateEmergencyAlertDto): Promise<EmergencyAlertDocument>;
    findAll(hospitalId?: string, status?: string): Promise<EmergencyAlertDocument[]>;
    findOne(id: string): Promise<EmergencyAlertDocument>;
    update(id: string, updateEmergencyAlertDto: UpdateEmergencyAlertDto): Promise<EmergencyAlertDocument>;
    remove(id: string): Promise<void>;
    resolveAlert(id: string, resolvedBy: string): Promise<EmergencyAlertDocument>;
    getActiveAlertCount(hospitalId: string): Promise<number>;
    getAlertsByType(hospitalId: string, startDate?: Date, endDate?: Date): Promise<any>;
}
