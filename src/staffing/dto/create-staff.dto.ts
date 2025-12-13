
import { 
  IsString, IsEmail, IsOptional, IsEnum, IsObject, IsArray, 
  ValidateNested, IsMongoId, IsBoolean, MinLength, IsNumber, IsLatitude, IsLongitude 
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

class ScheduleItemDto {
  @IsString()
  date: Date;

  @IsString()
  shift: string;

  @IsString()
  status: string;
}

// Staff Registration DTO
export class RegisterStaffDto {
  @IsMongoId()
  hospital: Types.ObjectId;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  position: string;

  @IsString()
  department: string;

  @IsString()
  @IsOptional()
  contactNumber?: string;

  @IsObject()
  @IsOptional()
  specializations?: Record<string, any>;
}

// Staff Login DTO
export class LoginStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

// Clock In DTO
export class ClockInDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsEnum(['morning', 'afternoon', 'night', 'emergency'])
  shift: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// Clock Out DTO
export class ClockOutDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

// Create Staff DTO (Admin use)
export class CreateStaffDto {
  @IsMongoId()
  hospital: Types.ObjectId;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  position: string;

  @IsString()
  department: string;

  @IsEnum(['Available', 'Unavailable', 'On Shift', 'Off Shift'])
  @IsOptional()
  availability?: string = 'Off Shift';

  @IsString()
  @IsOptional()
  contactNumber?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  @IsOptional()
  schedule?: Array<{
    date: Date;
    shift: string;
    status: string;
  }>;

  @IsObject()
  @IsOptional()
  specializations?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @IsEnum(['none', 'read', 'write', 'admin'])
  @IsOptional()
  emrAccessLevel?: string = 'none';

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean = false;
}

// Update Staff DTO
export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  contactNumber?: string;

  @IsObject()
  @IsOptional()
  specializations?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @IsEnum(['none', 'read', 'write', 'admin'])
  @IsOptional()
  emrAccessLevel?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}

// Update Bedspace by Staff DTO
export class StaffUpdateBedspaceDto {
  @IsNumber()
  @IsOptional()
  availableBeds?: number;

  @IsNumber()
  @IsOptional()
  occupiedBeds?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}