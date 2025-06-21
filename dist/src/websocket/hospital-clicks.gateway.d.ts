import { Server, Socket } from 'socket.io';
import { HospitalClicksService } from './hospital-clicks.service';
export declare class HospitalClicksGateway {
    private hospitalClicksService;
    server: Server;
    constructor(hospitalClicksService: HospitalClicksService);
    handleHospitalClick(data: {
        hospitalId: string;
        sessionId: string;
    }, client: Socket): Promise<{
        success: boolean;
        clickCount: any;
        eventEmitted: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        clickCount?: undefined;
        eventEmitted?: undefined;
    }>;
    getHospitalClicks(data: {
        hospitalId: string;
    }, client: Socket): Promise<void>;
    resetHospitalClicks(data: {
        hospitalId: string;
    }, client: Socket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
}
