import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import mongoose from 'mongoose';
export interface BedspaceDocument extends Document, Bedspace {
}
export declare class Bedspace {
    hospital: Types.ObjectId | string;
    departmentName: string;
    location: string;
    totalBeds: number;
    availableBeds: number;
    occupiedBeds: number;
    lastUpdated: Date;
    status: string;
    history: Array<{
        date: Date;
        available: number;
        occupied: number;
    }>;
}
export declare const BedspaceSchema: MongooseSchema<Document<Bedspace, any, any>, mongoose.Model<Document<Bedspace, any, any>, any, any, any, Document<unknown, any, Document<Bedspace, any, any>> & Document<Bedspace, any, any> & Required<{
    _id: Bedspace;
}>, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Document<Bedspace, any, any>, Document<unknown, {}, mongoose.FlatRecord<Document<Bedspace, any, any>>> & mongoose.FlatRecord<Document<Bedspace, any, any>> & Required<{
    _id: Bedspace;
}>>;
