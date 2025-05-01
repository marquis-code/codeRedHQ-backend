export declare class CreateEmergencyAlertDto {
    hospital: string;
    title: string;
    description: string;
    severity?: string;
    startTime: Date;
    endTime?: Date;
    status?: string;
    affectedDepartment?: string;
    actions?: string[];
}
