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
import { Document } from 'mongoose';
export type HospitalClickDocument = HospitalClick & Document;
export declare class HospitalClick {
    hospitalId: string;
    clickCount: number;
    eventEmitted: boolean;
    clickSessions: string[];
}
export declare const HospitalClickSchema: import("mongoose").Schema<Document<HospitalClick, any, any>, import("mongoose").Model<Document<HospitalClick, any, any>, any, any, any, Document<unknown, any, Document<HospitalClick, any, any>> & Document<HospitalClick, any, any> & Required<{
    _id: HospitalClick;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Document<HospitalClick, any, any>, Document<unknown, {}, import("mongoose").FlatRecord<Document<HospitalClick, any, any>>> & import("mongoose").FlatRecord<Document<HospitalClick, any, any>> & Required<{
    _id: HospitalClick;
}>>;
