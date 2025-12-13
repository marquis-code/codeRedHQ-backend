import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BedspaceDocument } from './schemas/bedspace.schema';
import { StaffDocument } from '../staffing/schemas/staff.schema';
import { CreateBedspaceDto } from './dto/create-bedspace.dto';
import { UpdateBedspaceDto } from './dto/update-bedspace.dto';
import { AuditService } from '../audit/audit.service';
export declare class BedspaceService {
    private bedspaceModel;
    private staffModel;
    private eventEmitter;
    private auditLogService;
    constructor(bedspaceModel: Model<BedspaceDocument>, staffModel: Model<StaffDocument>, eventEmitter: EventEmitter2, auditLogService: AuditService);
    create(createBedspaceDto: CreateBedspaceDto): Promise<BedspaceDocument>;
    findAllBedspaces(hospitalId?: string): Promise<BedspaceDocument[]>;
    findOne(id: string): Promise<BedspaceDocument>;
    updateByStaff(bedspaceId: string, staffId: string, updateData: {
        availableBeds?: number;
        occupiedBeds?: number;
        notes?: string;
    }, metadata?: {
        ipAddress?: string;
        userAgent?: string;
        location?: {
            latitude: number;
            longitude: number;
        };
    }): Promise<BedspaceDocument>;
    admitPatient(bedspaceId: string, staffId: string, metadata?: {
        ipAddress?: string;
        userAgent?: string;
        location?: {
            latitude: number;
            longitude: number;
        };
        notes?: string;
    }): Promise<BedspaceDocument>;
    dischargePatient(bedspaceId: string, staffId: string, metadata?: {
        ipAddress?: string;
        userAgent?: string;
        location?: {
            latitude: number;
            longitude: number;
        };
        notes?: string;
    }): Promise<BedspaceDocument>;
    getBedspaceHistory(bedspaceId: string): Promise<any>;
    update(id: string, updateBedspaceDto: UpdateBedspaceDto): Promise<BedspaceDocument>;
    remove(id: string): Promise<void>;
    getHospitalSummary(hospitalId: string): Promise<any>;
    updateBedAvailability(id: string, increment: boolean): Promise<BedspaceDocument>;
}
