/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose/types/inferschematype" />
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Hospital } from '../../hospital/schemas/hospital.schema';
export type SurgeDocument = Surge & Document;
export declare class Surge {
    hospital: Hospital;
    latitude: number;
    longitude: number;
    address: string;
    status: string;
    emergencyType: string;
    description: string;
    metadata: Record<string, any>;
}
export declare const SurgeSchema: MongooseSchema<Document<Surge, any, any>, import("mongoose").Model<Document<Surge, any, any>, any, any, any, Document<unknown, any, Document<Surge, any, any>> & Document<Surge, any, any> & Required<{
    _id: Surge;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Document<Surge, any, any>, Document<unknown, {}, import("mongoose").FlatRecord<Document<Surge, any, any>>> & import("mongoose").FlatRecord<Document<Surge, any, any>> & Required<{
    _id: Surge;
}>>;
