// // import { Module } from '@nestjs/common';
// // import { MongooseModule } from '@nestjs/mongoose';
// // import { JwtModule } from '@nestjs/jwt';
// // import { ConfigModule, ConfigService } from '@nestjs/config';

// // import { BedspaceGateway } from './gateways/bedspace.gateway';
// // import { Hospital, HospitalSchema } from '../hospital/schemas/hospital.schema';
// // import { Bedspace, BedspaceSchema } from '../bedspace/schemas/bedspace.schema';

// // @Module({
// //   imports: [
// //     JwtModule.registerAsync({
// //       imports: [ConfigModule],
// //       inject: [ConfigService],
// //       useFactory: async (configService: ConfigService) => ({
// //         secret: configService.get<string>('JWT_SECRET'),
// //         signOptions: { expiresIn: '1d' },
// //       }),
// //     }),
// //     MongooseModule.forFeature([
// //       { name: Hospital.name, schema: HospitalSchema },
// //       { name: Bedspace.name, schema: BedspaceSchema },
// //     ]),
// //   ],
// //   providers: [BedspaceGateway],
// //   exports: [BedspaceGateway],
// // })
// // export class WebsocketModule {}

// import { Module } from "@nestjs/common"
// import { MongooseModule } from "@nestjs/mongoose"
// import { JwtModule } from "@nestjs/jwt"
// import { ConfigModule, ConfigService } from "@nestjs/config"

// // Import schemas for both modules
// import { Hospital, HospitalSchema } from "../hospital/schemas/hospital.schema"
// import { Bedspace, BedspaceSchema } from "../bedspace/schemas/bedspace.schema"
// import { Surge, SurgeSchema } from "../surge/schema/surge.schema"

// // Import the unified gateway
// import { UnifiedHospitalGateway } from "./gateways/unified-hospital.gateway"

// @Module({
//   imports: [
//     JwtModule.registerAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => ({
//         secret: configService.get<string>("JWT_SECRET"),
//         signOptions: { expiresIn: "1d" },
//       }),
//     }),
//     MongooseModule.forFeature([
//       { name: Hospital.name, schema: HospitalSchema },
//       { name: Bedspace.name, schema: BedspaceSchema },
//       { name: Surge.name, schema: SurgeSchema },
//     ]),
//   ],
//   providers: [UnifiedHospitalGateway],
//   exports: [UnifiedHospitalGateway],
// })
// export class WebsocketModule {}


import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { JwtModule } from "@nestjs/jwt"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { EventEmitterModule } from "@nestjs/event-emitter"

// Import schemas for all modules
import { Hospital, HospitalSchema } from "../hospital/schemas/hospital.schema"
import { Bedspace, BedspaceSchema } from "../bedspace/schemas/bedspace.schema"
import { Surge, SurgeSchema } from "../surge/schema/surge.schema"

// Import the unified gateway
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
    ]),
  ],
  providers: [UnifiedHospitalGateway],
  exports: [UnifiedHospitalGateway],
})
export class WebsocketModule {}
