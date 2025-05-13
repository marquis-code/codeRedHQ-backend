"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const mongoose_3 = require("mongoose");
const hospital_schema_1 = require("../hospital/schemas/hospital.schema");
const bedspace_schema_1 = require("../bedspace/schemas/bedspace.schema");
let DatabaseService = DatabaseService_1 = class DatabaseService {
    constructor(connection) {
        this.connection = connection;
        this.logger = new common_1.Logger(DatabaseService_1.name);
        this.modelsRegistered = false;
    }
    async onModuleInit() {
        await this.registerModels();
    }
    async registerModels() {
        if (this.modelsRegistered) {
            return;
        }
        try {
            if (this.connection.readyState !== 1) {
                this.logger.log('Waiting for MongoDB connection to be ready before registering models...');
                await new Promise((resolve) => {
                    const checkConnection = () => {
                        if (this.connection.readyState === 1) {
                            resolve(true);
                        }
                        else {
                            setTimeout(checkConnection, 1000);
                        }
                    };
                    checkConnection();
                });
            }
            this.registerModel('Hospital', hospital_schema_1.HospitalSchema);
            this.registerModel('Bedspace', bedspace_schema_1.BedspaceSchema);
            this.modelsRegistered = true;
            this.logger.log('All models registered successfully');
        }
        catch (error) {
            this.logger.error(`Error registering models: ${error.message}`);
        }
    }
    registerModel(name, schema) {
        try {
            if (mongoose_3.default.modelNames().includes(name)) {
                this.logger.log(`Model ${name} is already registered`);
                return mongoose_3.default.model(name);
            }
            const model = mongoose_3.default.model(name, schema);
            this.logger.log(`Model ${name} registered successfully`);
            return model;
        }
        catch (error) {
            this.logger.error(`Error registering model ${name}: ${error.message}`);
            throw error;
        }
    }
    getModel(name) {
        try {
            return mongoose_3.default.model(name);
        }
        catch (error) {
            this.logger.error(`Error getting model ${name}: ${error.message}`);
            return null;
        }
    }
    async executeWithRetry(operation, maxRetries = 3) {
        let retries = 0;
        while (retries < maxRetries) {
            try {
                return await operation();
            }
            catch (error) {
                retries++;
                if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
                    this.logger.warn(`MongoDB operation timed out, retrying (${retries}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
                    if (this.connection.readyState !== 1) {
                        this.logger.warn('Connection is not ready, attempting to reconnect...');
                        await this.reconnect();
                    }
                }
                else if (retries >= maxRetries) {
                    throw error;
                }
                else {
                    this.logger.error(`Error executing MongoDB operation: ${error.message}`);
                    throw error;
                }
            }
        }
        throw new Error(`Failed after ${maxRetries} retries`);
    }
    async reconnect() {
        try {
            if (this.connection) {
                await this.connection.close();
            }
            const mongoUri = process.env.MONGO_URL;
            await mongoose_3.default.connect(mongoUri);
            this.logger.log('MongoDB reconnection successful');
        }
        catch (error) {
            this.logger.error(`MongoDB reconnection failed: ${error.message}`);
        }
    }
};
DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectConnection)()),
    __metadata("design:paramtypes", [mongoose_2.Connection])
], DatabaseService);
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=database.service.js.map