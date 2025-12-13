// import { IsNotEmpty, IsString, IsOptional, IsObject, IsMongoId } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';
// import { Types } from 'mongoose';

// export class CreateAuditLogDto {
//   @ApiProperty({ description: 'Hospital ID' })
//   @IsMongoId()
//   @IsNotEmpty()
//   hospital: Types.ObjectId;

//   @ApiProperty({ description: 'Module name (e.g., bedspace, staff, emergency)' })
//   @IsString()
//   @IsNotEmpty()
//   module: string;

//   @ApiProperty({ description: 'Action performed (e.g., create, update, delete)' })
//   @IsString()
//   @IsNotEmpty()
//   action: string;

//   @ApiProperty({ description: 'ID of the affected resource' })
//   @IsOptional()
//   resourceId?: any;

//   @ApiProperty({ description: 'Previous state of the resource' })
//   @IsOptional()
//   @IsObject()
//   previousState?: any;

//   @ApiProperty({ description: 'New state of the resource' })
//   @IsOptional()
//   @IsObject()
//   newState?: any;

//   @ApiProperty({ description: 'IP address of the user' })
//   @IsOptional()
//   @IsString()
//   ipAddress?: string;

//   @ApiProperty({ description: 'User agent of the client' })
//   @IsOptional()
//   @IsString()
//   userAgent?: string;

//   @ApiProperty({ description: 'User who performed the action' })
//   @IsOptional()
//   @IsString()
//   performedBy?: string;
// }

import { IsNotEmpty, IsString, IsOptional, IsObject, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class CreateAuditLogDto {
  @ApiProperty({ description: 'Hospital ID' })
  @IsMongoId()
  @IsNotEmpty()
  hospital: Types.ObjectId | string;

  @ApiProperty({ description: 'Staff ID' })
  @IsMongoId()
  @IsNotEmpty()
  staff: Types.ObjectId | string;

  @ApiProperty({ description: 'Action performed' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ description: 'Resource type (e.g., Bedspace, Patient, MedicalVisit)' })
  @IsString()
  @IsNotEmpty()
  resourceType: string;

  @ApiProperty({ description: 'ID of the affected resource' })
  @IsOptional()
  resourceId?: Types.ObjectId | string;

  @ApiProperty({ description: 'Previous state of the resource' })
  @IsOptional()
  @IsObject()
  previousState?: Record<string, any>;

  @ApiProperty({ description: 'New state of the resource' })
  @IsOptional()
  @IsObject()
  newState?: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Notes about the action' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Location coordinates' })
  @IsOptional()
  location?: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({ description: 'Status of the action' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'IP address of the user' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ description: 'User agent of the client' })
  @IsOptional()
  @IsString()
  userAgent?: string;
}