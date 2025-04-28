import { IsString, IsArray, IsBoolean, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OperatingHoursDto {
  @IsString()
  @IsOptional()
  day?: string;

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
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  details?: string;
}

class DoctorOnDutyContactDto {
  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  contact?: string;
}

export class UpdateHospitalDto {
  // UUID should not be updatable
  @IsString()
  @IsOptional()
  readonly uuid?: never;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  hospitalName?: string;

  @IsString()
  @IsOptional()
  contactInformation?: string;

  @IsString()
  @IsOptional()
  address?: string;

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
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}