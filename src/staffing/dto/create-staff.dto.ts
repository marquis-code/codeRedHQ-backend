// dto/create-staff.dto.ts
import { IsString, IsEmail, IsOptional, IsEnum, IsObject, IsArray, ValidateNested, IsMongoId } from 'class-validator';
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

export class CreateStaffDto {
  @IsMongoId()
  hospital: Types.ObjectId;

  @IsString()
  name: string;

  @IsString()
  position: string;

  @IsString()
  department: string;

  @IsEnum(['Available', 'Unavailable'])
  @IsOptional()
  availability?: string = 'Available';

  @IsString()
  @IsOptional()
  contactNumber?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

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

  @IsOptional()
  isActive?: boolean = true;
}