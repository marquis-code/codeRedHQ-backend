import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BedspaceDocument } from './schemas/bedspace.schema';
import { CreateBedspaceDto } from './dto/create-bedspace.dto';
import { UpdateBedspaceDto } from './dto/update-bedspace.dto';
export declare class BedspaceService {
    private bedspaceModel;
    private eventEmitter;
    constructor(bedspaceModel: Model<BedspaceDocument>, eventEmitter: EventEmitter2);
    create(createBedspaceDto: CreateBedspaceDto): Promise<BedspaceDocument>;
    findAllBedspaces(hospitalId?: string): Promise<BedspaceDocument[]>;
    findOne(id: string): Promise<BedspaceDocument>;
    update(id: string, updateBedspaceDto: UpdateBedspaceDto): Promise<BedspaceDocument>;
    remove(id: string): Promise<void>;
    getHospitalSummary(hospitalId: string): Promise<any>;
    updateBedAvailability(id: string, increment: boolean): Promise<BedspaceDocument>;
}
