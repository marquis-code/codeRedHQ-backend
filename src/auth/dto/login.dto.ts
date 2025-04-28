import { IsNotEmpty,IsString, IsEmail, IsStrongPassword } from 'class-validator';
import { Type } from 'class-transformer';

export class LoginDto {
   @IsString()
   @IsNotEmpty()
   uuid?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword()
  @IsNotEmpty()
  password: string;
}