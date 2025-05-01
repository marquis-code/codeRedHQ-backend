import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { BedspaceGateway } from './gateways/bedspace.gateway';
import { Hospital, HospitalSchema } from '../hospital/schemas/hospital.schema';
import { Bedspace, BedspaceSchema } from '../bedspace/schemas/bedspace.schema';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalSchema },
      { name: Bedspace.name, schema: BedspaceSchema },
    ]),
  ],
  providers: [BedspaceGateway],
  exports: [BedspaceGateway],
})
export class WebsocketModule {}