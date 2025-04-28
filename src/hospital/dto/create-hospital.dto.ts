import { IsString, IsArray, IsBoolean, IsOptional, IsNumber, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class OperatingHoursDto {
  @IsString()
  @IsNotEmpty()
  day: string;

  @IsString()
  @IsNotEmpty()
  open: string;

  @IsString()
  @IsNotEmpty()
  close: string;

  @IsBoolean()
  is24Hours: boolean;
}

class EmergencyEquipmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  details: string;
}

class DoctorOnDutyContactDto {
  @IsString()
  @IsNotEmpty()
  specialty: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  contact: string;
}

export class CreateHospitalDto {
  @IsString()
  @IsOptional()
  uuid?: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  hospitalName: string;

  @IsString()
  @IsNotEmpty()
  contactInformation: string;

  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}