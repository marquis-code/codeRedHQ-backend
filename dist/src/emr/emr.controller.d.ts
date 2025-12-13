import { EMRService, CreatePatientDto, CreateMedicalVisitDto } from './emr.service';
import { PatientDocument, MedicalVisitDocument } from './schemas/emr.schema';
export declare class EMRController {
    private readonly emrService;
    constructor(emrService: EMRService);
    createPatient(createPatientDto: CreatePatientDto, req: any): Promise<PatientDocument>;
    getPatientByMRN(mrn: string, req: any): Promise<PatientDocument>;
    searchPatients(hospitalId: string, firstName?: string, lastName?: string, nationalId?: string, phoneNumber?: string, status?: string, req?: any): Promise<PatientDocument[]>;
    getPatientHistory(patientId: string, req: any): Promise<{
        patient: PatientDocument;
        visits: MedicalVisitDocument[];
    }>;
    createMedicalVisit(createVisitDto: CreateMedicalVisitDto, req: any): Promise<MedicalVisitDocument>;
    updateMedicalVisit(visitId: string, updateData: Partial<CreateMedicalVisitDto>, req: any): Promise<MedicalVisitDocument>;
    dischargePatient(visitId: string, body: {
        dischargeSummary: string;
    }, req: any): Promise<MedicalVisitDocument>;
    getSurgeAnalytics(hospitalId: string, startDate: string, endDate: string): Promise<any>;
}
