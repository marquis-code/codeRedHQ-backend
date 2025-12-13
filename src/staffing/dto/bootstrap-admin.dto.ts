import { IsEmail, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';
import { Types } from 'mongoose';

export class BootstrapAdminDto {
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
}
