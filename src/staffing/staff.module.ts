// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { JwtModule } from '@nestjs/jwt';
// import { PassportModule } from '@nestjs/passport';
// import { ConfigModule, ConfigService } from '@nestjs/config';

// import { StaffingController } from './staff.controller';
// import { StaffingService } from './staff.service';
// import { Staff, StaffSchema } from './schemas/staff.schema';
// import { Hospital, HospitalSchema } from '../hospital/schemas/hospital.schema';
// import { AuditModule } from '../audit/audit.module';

// @Module({
//   imports: [
//     ConfigModule, // Add ConfigModule
//     MongooseModule.forFeature([
//       { name: Staff.name, schema: StaffSchema },
//       { name: Hospital.name, schema: HospitalSchema },
//     ]),
//     PassportModule.register({ defaultStrategy: 'jwt' }),
//     // Use ConfigService for consistent JWT secret
//     JwtModule.registerAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => ({
//         secret: configService.get<string>('JWT_SECRET'),
//         signOptions: { expiresIn: '7d' },
//       }),
//     }),
//     AuditModule,
//   ],
//   controllers: [StaffingController],
//   providers: [StaffingService],
//   exports: [StaffingService, JwtModule],
// })
// export class StaffingModule {}

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { StaffingController } from './staff.controller';
import { StaffingService } from './staff.service';
import { Staff, StaffSchema } from './schemas/staff.schema';
import { Hospital, HospitalSchema } from '../hospital/schemas/hospital.schema';
import { AuditModule } from '../audit/audit.module';
import { HospitalModule } from '../hospital/hospital.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Staff.name, schema: StaffSchema },
      { name: Hospital.name, schema: HospitalSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    AuditModule,
    forwardRef(() => HospitalModule), // ✅ Add this to avoid circular dependency
  ],
  controllers: [StaffingController],
  providers: [StaffingService],
  exports: [StaffingService, JwtModule, MongooseModule],
})
export class StaffingModule {}