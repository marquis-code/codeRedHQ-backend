declare class OperatingHoursDto {
    day: string;
    open?: string;
    close?: string;
    is24Hours?: boolean;
}
declare class EmergencyEquipmentDto {
    name: string;
    details: string;
}
declare class LocationDto {
    type: string;
    coordinates: number[];
}
declare class DoctorOnDutyContactDto {
    specialty: string;
    name: string;
    contact: string;
}
export declare class CreateHospitalDto {
    hospitalName: string;
    email: string;
    password: string;
    contactInformation: string;
    address: string;
    website?: string;
    operatingHours?: OperatingHoursDto[];
    facilityType?: string;
    availableSpecialties?: string[];
    emergencyServices?: string;
    capacity?: string;
    emergencyEquipment?: EmergencyEquipmentDto[];
    emergencyContactNumber?: string;
    emergencyDepartment?: string;
    doctorOnDutyContact?: DoctorOnDutyContactDto[];
    acceptedInsuranceProviders?: string[];
    emergencyPaymentPolicies?: string[];
    expectedResponseTime?: string;
    dedicatedPointOfContact?: string;
    communicationProtocols?: string;
    airAmbulance?: string;
    telemedicineServices?: string;
    latitude: number;
    longitude: number;
    location?: LocationDto;
}
export {};
