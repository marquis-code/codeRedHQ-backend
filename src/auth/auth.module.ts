import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwtStratergy';
import { LocalStrategy } from './localStrategy';
import { Hospital, HospitalSchema } from '../hospital/schemas/hospital.schema';
import { UserModule } from '../user/user.module';
import { HospitalModule } from '../hospital/hospital.module';

@Module({
  imports: [
    forwardRef(() => HospitalModule), // Use forwardRef to avoid circular dependency
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_secret_change_in_production',
        signOptions: { expiresIn: '1d' },
      }),
    }),
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalSchema }
    ]),
    forwardRef(() => UserModule), // Add this line
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}