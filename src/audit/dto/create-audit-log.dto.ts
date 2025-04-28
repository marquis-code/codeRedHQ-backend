import { IsNotEmpty, IsString, IsOptional, IsObject, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class CreateAuditLogDto {
  @ApiProperty({ description: 'Hospital ID' })
  @IsMongoId()
  @IsNotEmpty()
  hospital: Types.ObjectId;

  @ApiProperty({ description: 'Module name (e.g., bedspace, staff, emergency)' })
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty({ description: 'Action performed (e.g., create, update, delete)' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ description: 'ID of the affected resource' })
  @IsOptional()
  resourceId?: any;

  @ApiProperty({ description: 'Previous state of the resource' })
  @IsOptional()
  @IsObject()
  previousState?: any;

  @ApiProperty({ description: 'New state of the resource' })
  @IsOptional()
  @IsObject()
  newState?: any;

  @ApiProperty({ description: 'IP address of the user' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ description: 'User agent of the client' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ description: 'User who performed the action' })
  @IsOptional()
  @IsString()
  performedBy?: string;
}