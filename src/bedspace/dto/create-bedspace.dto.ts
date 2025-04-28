import { IsString, IsNumber, IsNotEmpty, IsMongoId, IsDate, IsOptional, IsEnum, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

class HistoryEntryDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNumber()
  @Min(0)
  available: number;

  @IsNumber()
  @Min(0)
  occupied: number;
}

export class CreateBedspaceDto {
  @IsMongoId()
  @IsNotEmpty()
  hospital: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  departmentName: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  totalBeds: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  availableBeds: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  occupiedBeds: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  lastUpdated?: Date;

  @IsEnum(['Available', 'Limited', 'Unavailable'])
  @IsOptional()
  status?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HistoryEntryDto)
  history?: HistoryEntryDto[];
}