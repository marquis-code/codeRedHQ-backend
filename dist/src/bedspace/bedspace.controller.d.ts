import { BedspaceService } from './bedspace.service';
import { CreateBedspaceDto } from './dto/create-bedspace.dto';
import { UpdateBedspaceDto } from './dto/update-bedspace.dto';
import { BedspaceDocument } from './schemas/bedspace.schema';
export declare class BedspaceController {
    private readonly bedspaceService;
    constructor(bedspaceService: BedspaceService);
    create(createBedspaceDto: CreateBedspaceDto): Promise<BedspaceDocument>;
    findAll(hospitalId?: string): Promise<BedspaceDocument[]>;
    findOne(id: string): Promise<BedspaceDocument>;
    update(id: string, updateBedspaceDto: UpdateBedspaceDto): Promise<BedspaceDocument>;
    remove(id: string): Promise<void>;
    getHospitalSummary(hospitalId: string): Promise<any>;
    updateBedAvailability(id: string, action: string): Promise<BedspaceDocument>;
}
