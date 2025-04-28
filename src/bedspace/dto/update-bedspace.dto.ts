import { IsString, IsNumber, IsOptional, IsMongoId, IsDate, IsEnum, ValidateNested, Min } from 'class-validator';
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

export class UpdateBedspaceDto {
  @IsMongoId()
  @IsOptional()
  hospital?: Types.ObjectId;

  @IsString()
  @IsOptional()
  departmentName?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalBeds?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  availableBeds?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  occupiedBeds?: number;

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