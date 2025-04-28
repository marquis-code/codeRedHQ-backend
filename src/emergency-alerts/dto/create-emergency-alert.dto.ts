import { IsString, IsNotEmpty, IsEnum, IsDate, IsOptional, IsMongoId, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmergencyAlertDto {
  @ApiProperty({ description: 'Hospital ID' })
  @IsMongoId()
  @IsNotEmpty()
  hospital: string;

  @ApiProperty({ description: 'Alert title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Alert description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Alert severity', enum: ['High', 'Moderate', 'Low'], default: 'Moderate' })
  @IsEnum(['High', 'Moderate', 'Low'])
  @IsOptional()
  severity?: string;

  @ApiProperty({ description: 'Alert start time' })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startTime: Date;

  @ApiPropertyOptional({ description: 'Alert end time' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endTime?: Date;

  @ApiPropertyOptional({ description: 'Alert status', enum: ['Active', 'Resolved', 'Expired'], default: 'Active' })
  @IsEnum(['Active', 'Resolved', 'Expired'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Affected department' })
  @IsString()
  @IsOptional()
  affectedDepartment?: string;

  @ApiPropertyOptional({ description: 'List of actions taken' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  actions?: string[];
}