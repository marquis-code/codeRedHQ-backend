import { 
  Controller, Get, Post, Body, Param, Put, Query, 
  HttpStatus, HttpCode, UseGuards, Req 
} from '@nestjs/common';
import { EMRService, CreatePatientDto, CreateMedicalVisitDto } from './emr.service';
import { PatientDocument, MedicalVisitDocument } from './schemas/emr.schema';

@Controller('emr')
export class EMRController {
  constructor(private readonly emrService: EMRService) {}

  // Patient Management
  @Post('patients')
  @HttpCode(HttpStatus.CREATED)
  // @UseGuards(JwtAuthGuard)
  async createPatient(
    @Body() createPatientDto: CreatePatientDto,
    @Req() req: any,
  ): Promise<PatientDocument> {
    const staffId = req.user?.sub;
    return this.emrService.createPatient(createPatientDto, staffId);
  }

  @Get('patients/mrn/:mrn')
  // @UseGuards(JwtAuthGuard)
  async getPatientByMRN(
    @Param('mrn') mrn: string,
    @Req() req: any,
  ): Promise<PatientDocument> {
    const staffId = req.user?.sub;
    return this.emrService.getPatientByMRN(mrn, staffId);
  }

  @Get('patients/search')
  // @UseGuards(JwtAuthGuard)
  async searchPatients(
    @Query('hospitalId') hospitalId: string,
    @Query('firstName') firstName?: string,
    @Query('lastName') lastName?: string,
    @Query('nationalId') nationalId?: string,
    @Query('phoneNumber') phoneNumber?: string,
    @Query('status') status?: string,
    @Req() req?: any,
  ): Promise<PatientDocument[]> {
    const staffId = req.user?.sub;
    return this.emrService.searchPatients(hospitalId, staffId, {
      firstName,
      lastName,
      nationalId,
      phoneNumber,
      status,
    });
  }

  @Get('patients/:id/history')
  // @UseGuards(JwtAuthGuard)
  async getPatientHistory(
    @Param('id') patientId: string,
    @Req() req: any,
  ): Promise<{ patient: PatientDocument; visits: MedicalVisitDocument[] }> {
    const staffId = req.user?.sub;
    return this.emrService.getPatientHistory(patientId, staffId);
  }

  // Medical Visit Management
  @Post('visits')
  @HttpCode(HttpStatus.CREATED)
  // @UseGuards(JwtAuthGuard)
  async createMedicalVisit(
    @Body() createVisitDto: CreateMedicalVisitDto,
    @Req() req: any,
  ): Promise<MedicalVisitDocument> {
    const staffId = req.user?.sub;
    return this.emrService.createMedicalVisit(createVisitDto, staffId);
  }

  @Put('visits/:id')
  // @UseGuards(JwtAuthGuard)
  async updateMedicalVisit(
    @Param('id') visitId: string,
    @Body() updateData: Partial<CreateMedicalVisitDto>,
    @Req() req: any,
  ): Promise<MedicalVisitDocument> {
    const staffId = req.user?.sub;
    return this.emrService.updateMedicalVisit(visitId, updateData, staffId);
  }

  @Post('visits/:id/discharge')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  async dischargePatient(
    @Param('id') visitId: string,
    @Body() body: { dischargeSummary: string },
    @Req() req: any,
  ): Promise<MedicalVisitDocument> {
    const staffId = req.user?.sub;
    return this.emrService.dischargePatient(
      visitId,
      body.dischargeSummary,
      staffId,
    );
  }

  // Surge Analytics
  @Get('surge/analytics')
  // @UseGuards(JwtAuthGuard)
  async getSurgeAnalytics(
    @Query('hospitalId') hospitalId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any> {
    return this.emrService.getSurgeAnalytics(
      hospitalId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}