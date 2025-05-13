"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedspaceModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const event_emitter_1 = require("@nestjs/event-emitter");
const bedspace_controller_1 = require("./bedspace.controller");
const bedspace_service_1 = require("./bedspace.service");
const bedspace_schema_1 = require("./schemas/bedspace.schema");
const hospital_module_1 = require("../hospital/hospital.module");
let BedspaceModule = class BedspaceModule {
};
BedspaceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: bedspace_schema_1.Bedspace.name, schema: bedspace_schema_1.BedspaceSchema },
            ]),
            hospital_module_1.HospitalModule,
            event_emitter_1.EventEmitterModule.forRoot(),
        ],
        controllers: [bedspace_controller_1.BedspaceController],
        providers: [bedspace_service_1.BedspaceService],
        exports: [bedspace_service_1.BedspaceService],
    })
], BedspaceModule);
exports.BedspaceModule = BedspaceModule;
//# sourceMappingURL=bedspace.module.js.map