// // src/hospital-clicks/hospital-clicks.module.ts
// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { HospitalClick, HospitalClickSchema } from './schemas/hospital-click.schema';
// import { HospitalClicksService } from './hospital-clicks.service';
// import { HospitalClicksGateway } from './hospital-clicks.gateway';

// @Module({
//   imports: [
//     MongooseModule.forFeature([
//       { name: HospitalClick.name, schema: HospitalClickSchema },
//     ]),
//   ],
//   providers: [HospitalClicksService, HospitalClicksGateway],
//   exports: [HospitalClicksService],
// })
// export class HospitalClicksModule {}

// import { Module } from "@nestjs/common"
// import { MongooseModule } from "@nestjs/mongoose"
// import { HospitalClick, HospitalClickSchema } from "./schemas/hospital-click.schema"
// import { Hospital, HospitalSchema } from "../hospital/schemas/hospital.schema"
// import { HospitalClicksService } from "./hospital-clicks.service"

// @Module({
//   imports: [
//     MongooseModule.forFeature([
//       { name: HospitalClick.name, schema: HospitalClickSchema },
//       { name: Hospital.name, schema: HospitalSchema },
//     ]),
//   ],
//   providers: [HospitalClicksService],
//   exports: [HospitalClicksService],
// })
// export class HospitalClicksModule {}


import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { HospitalClick, HospitalClickSchema } from "./schemas/hospital-click.schema"
import { Hospital, HospitalSchema } from "../hospital/schemas/hospital.schema"
import { HospitalClicksService } from "./hospital-clicks.service"
import { HospitalClicksGateway } from "../websocket/gateways/hospital-clicks.gateway"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HospitalClick.name, schema: HospitalClickSchema },
      { name: Hospital.name, schema: HospitalSchema },
    ]),
    EventEmitterModule,
  ],
  providers: [HospitalClicksService, HospitalClicksGateway],
  exports: [HospitalClicksService, HospitalClicksGateway],
})
export class HospitalClicksModule {}
