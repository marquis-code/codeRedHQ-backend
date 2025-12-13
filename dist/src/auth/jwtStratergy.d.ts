import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { StaffDocument } from '../staffing/schemas/staff.schema';
declare const JwtStrategy_base: new (...args: any[]) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private staffModel;
    private configService;
    constructor(staffModel: Model<StaffDocument>, configService: ConfigService);
    validate(payload: any): Promise<any>;
}
export {};
