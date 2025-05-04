import { IsString, IsNumber, IsObject, IsOptional, IsEmail, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class OperatingHoursDto {
  @IsString()
  day: string;

  @IsString()
  @IsOptional()
  open?: string;

  @IsString()
  @IsOptional()
  close?: string;

  @IsBoolean()
  @IsOptional()
  is24Hours?: boolean;
}

class EmergencyEquipmentDto {
  @IsString()
  name: string;

  @IsString()
  details: string;
}

class LocationDto {
  @IsString()
  type: string;

  @IsArray()
  coordinates: number[];
}



class DoctorOnDutyContactDto {
  @IsString()
  specialty: string;

  @IsString()
  name: string;

  @IsString()
  contact: string;
}

export class CreateHospitalDto {
  @IsString()
  hospitalName: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  contactInformation: string;

  @IsString()
  address: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHoursDto)
  @IsOptional()
  operatingHours?: OperatingHoursDto[];

  @IsString()
  @IsOptional()
  facilityType?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableSpecialties?: string[];

  @IsString()
  @IsOptional()
  emergencyServices?: string;

  @IsString()
  @IsOptional()
  capacity?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyEquipmentDto)
  @IsOptional()
  emergencyEquipment?: EmergencyEquipmentDto[];

  @IsString()
  @IsOptional()
  emergencyContactNumber?: string;

  @IsString()
  @IsOptional()
  emergencyDepartment?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DoctorOnDutyContactDto)
  @IsOptional()
  doctorOnDutyContact?: DoctorOnDutyContactDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  acceptedInsuranceProviders?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  emergencyPaymentPolicies?: string[];

  @IsString()
  @IsOptional()
  expectedResponseTime?: string;

  @IsString()
  @IsOptional()
  dedicatedPointOfContact?: string;

  @IsString()
  @IsOptional()
  communicationProtocols?: string;

  @IsString()
  @IsOptional()
  airAmbulance?: string;

  @IsString()
  @IsOptional()
  telemedicineServices?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;
}