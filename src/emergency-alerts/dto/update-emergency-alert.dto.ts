import { IsString, IsNotEmpty, IsEnum, IsDate, IsOptional, IsMongoId, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmergencyAlertDto {
    @ApiPropertyOptional({ description: 'Alert title' })
    @IsString()
    @IsOptional()
    title?: string;
  
    @ApiPropertyOptional({ description: 'Alert description' })
    @IsString()
    @IsOptional()
    description?: string;
  
    @ApiPropertyOptional({ description: 'Alert severity', enum: ['High', 'Moderate', 'Low'] })
    @IsEnum(['High', 'Moderate', 'Low'])
    @IsOptional()
    severity?: string;
  
    @ApiPropertyOptional({ description: 'Alert end time' })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    endTime?: Date;
  
    @ApiPropertyOptional({ description: 'Alert status', enum: ['Active', 'Resolved', 'Expired'] })
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
  
    @ApiPropertyOptional({ description: 'Resolved by (user ID or name)' })
    @IsString()
    @IsOptional()
    resolvedBy?: string;
  
    @ApiPropertyOptional({ description: 'Time when the alert was resolved' })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    resolvedAt?: Date;
  }