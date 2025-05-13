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
var DatabaseModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
let DatabaseModule = DatabaseModule_1 = class DatabaseModule {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(DatabaseModule_1.name);
    }
    async onModuleInit() {
        try {
            const mongoUri = this.configService.get('MONGO_URL');
            if (!mongoUri) {
                throw new Error('MONGO_URL environment variable is not defined');
            }
            this.logger.log(`Database connection initialized with URI: ${mongoUri}`);
            mongoose_2.default.set('debug', process.env.NODE_ENV !== 'production');
            mongoose_2.default.connection.on('connected', () => {
                this.logger.log('MongoDB connected successfully');
            });
            mongoose_2.default.connection.on('error', (err) => {
                this.logger.error(`MongoDB connection error: ${err}`);
            });
            mongoose_2.default.connection.on('disconnected', () => {
                this.logger.warn('MongoDB disconnected');
            });
            this.logger.log('Database initialization complete');
        }
        catch (error) {
            this.logger.error(`Error during database initialization: ${error.message}`);
        }
    }
};
DatabaseModule = DatabaseModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => {
                    const mongoUri = configService.get('MONGO_URL');
                    if (!mongoUri) {
                        throw new Error('MONGO_URL environment variable is not defined');
                    }
                    return {
                        uri: mongoUri,
                        useNewUrlParser: true,
                        useUnifiedTopology: true,
                        connectTimeoutMS: 30000,
                        socketTimeoutMS: 60000,
                        serverSelectionTimeoutMS: 30000,
                        maxPoolSize: 50,
                        minPoolSize: 10,
                        maxIdleTimeMS: 30000,
                        heartbeatFrequencyMS: 10000,
                        retryWrites: true,
                        retryReads: true,
                    };
                },
            }),
        ],
        exports: [mongoose_1.MongooseModule],
    }),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseModule);
exports.DatabaseModule = DatabaseModule;
//# sourceMappingURL=database.module.js.map