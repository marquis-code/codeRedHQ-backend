import { OnModuleInit } from '@nestjs/common';
import { Connection } from 'mongoose';
import mongoose from 'mongoose';
export declare class DatabaseService implements OnModuleInit {
    private readonly connection;
    private readonly logger;
    private modelsRegistered;
    constructor(connection: Connection);
    onModuleInit(): Promise<void>;
    registerModels(): Promise<void>;
    private registerModel;
    getModel(name: string): mongoose.Model<any, unknown, unknown, unknown, any, any>;
    executeWithRetry<T>(operation: () => Promise<T>, maxRetries?: number): Promise<T>;
    private reconnect;
}
