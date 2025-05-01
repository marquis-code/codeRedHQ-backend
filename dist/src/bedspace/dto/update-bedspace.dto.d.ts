import { Types } from 'mongoose';
declare class HistoryEntryDto {
    date: Date;
    available: number;
    occupied: number;
}
export declare class UpdateBedspaceDto {
    hospital?: Types.ObjectId;
    departmentName?: string;
    location?: string;
    totalBeds?: number;
    availableBeds?: number;
    occupiedBeds?: number;
    lastUpdated?: Date;
    status?: string;
    history?: HistoryEntryDto[];
}
export {};
