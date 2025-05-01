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
export type HospitalDocument = Hospital & Document;
export interface HospitalMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export type HospitalModel = HospitalDocument & HospitalMethods;
export declare class Hospital {
    _id: MongooseSchema.Types.ObjectId;
    username: string;
    email: string;
    password: string;
    hospitalName: string;
    contactInformation: string;
    address: string;
    website: string;
    operatingHours: Array<{
        day: string;
        open: string;
        close: string;
        is24Hours: boolean;
    }>;
    facilityType: string;
    availableSpecialties: string[];
    emergencyServices: string;
    capacity: string;
    emergencyEquipment: Array<{
        name: string;
        details: string;
    }>;
    emergencyContactNumber: string;
    emergencyDepartment: string;
    doctorOnDutyContact: Array<{
        specialty: string;
        name: string;
        contact: string;
    }>;
    acceptedInsuranceProviders: string[];
    emergencyPaymentPolicies: string[];
    expectedResponseTime: string;
    dedicatedPointOfContact: string;
    communicationProtocols: string;
    airAmbulance: string;
    telemedicineServices: string;
    latitude: number;
    longitude: number;
    isActive: boolean;
}
export declare const HospitalSchema: MongooseSchema<Document<Hospital, any, any>, import("mongoose").Model<Document<Hospital, any, any>, any, any, any, Document<unknown, any, Document<Hospital, any, any>> & Document<Hospital, any, any> & Required<{
    _id: Hospital;
}>, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Document<Hospital, any, any>, Document<unknown, {}, import("mongoose").FlatRecord<Document<Hospital, any, any>>> & import("mongoose").FlatRecord<Document<Hospital, any, any>> & Required<{
    _id: Hospital;
}>>;
