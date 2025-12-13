"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurgePredictionModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const surge_prediction_controller_1 = require("../surge-prediction/surge-prediction.controller");
const emr_schema_1 = require("../emr/schemas/emr.schema");
const surge_prediction_service_1 = require("./surge-prediction.service");
let SurgePredictionModule = class SurgePredictionModule {
};
SurgePredictionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: emr_schema_1.SurgeData.name, schema: emr_schema_1.SurgeDataSchema },
                { name: emr_schema_1.MedicalVisit.name, schema: emr_schema_1.MedicalVisitSchema },
            ]),
        ],
        controllers: [surge_prediction_controller_1.SurgePredictionController],
        providers: [surge_prediction_service_1.SurgePredictionService],
        exports: [surge_prediction_service_1.SurgePredictionService],
    })
], SurgePredictionModule);
exports.SurgePredictionModule = SurgePredictionModule;
//# sourceMappingURL=surge-prediction.module.js.map