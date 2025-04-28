import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Bedspace, BedspaceDocument } from './schemas/bedspace.schema';
import { CreateBedspaceDto } from './dto/create-bedspace.dto';
import { UpdateBedspaceDto } from './dto/update-bedspace.dto';
export declare class BedspaceService {
    private bedspaceModel;
    private eventEmitter;
    constructor(bedspaceModel: Model<BedspaceDocument>, eventEmitter: EventEmitter2);
    create(createBedspaceDto: CreateBedspaceDto): Promise<Bedspace>;
    findAll(hospitalId?: string): Promise<Bedspace[]>;
    findOne(id: string): Promise<Bedspace>;
    update(id: string, updateBedspaceDto: UpdateBedspaceDto): Promise<Bedspace>;
    remove(id: string): Promise<void>;
    getHospitalSummary(hospitalId: string): Promise<any>;
    updateBedAvailability(id: string, increment: boolean): Promise<Bedspace>;
}
