

import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { JwtModule } from "@nestjs/jwt"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { EventEmitterModule } from "@nestjs/event-emitter"

// Import schemas for all modules
import { Hospital, HospitalSchema } from "../hospital/schemas/hospital.schema"
import { Bedspace, BedspaceSchema } from "../bedspace/schemas/bedspace.schema"
import { Surge, SurgeSchema } from "../surge/schema/surge.schema"
import { HospitalClick, HospitalClickSchema } from "../hospital-click/schemas/hospital-click.schema"

// Import the unified gateway
import { HospitalClicksModule } from "../hospital-click/hospital-clicks.module"
import { UnifiedHospitalGateway } from "./gateways/unified-hospital.gateway"

@Module({
  imports: [
    // Add EventEmitterModule
    EventEmitterModule.forRoot(),

    // JWT Module
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") || "your-secret-key",
        signOptions: { expiresIn: "1d" },
      }),
    }),

    // Mongoose Models
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalSchema },
      { name: Bedspace.name, schema: BedspaceSchema },
      { name: Surge.name, schema: SurgeSchema },
      { name: HospitalClick.name, schema: HospitalClickSchema }
    ]),
    HospitalClicksModule,
  ],
  providers: [UnifiedHospitalGateway],
  exports: [UnifiedHospitalGateway],
})
export class WebsocketModule {}
