import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put, ValidationPipe, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';

import { EmergencyAlertsService } from './emergency-alerts.service';
import { CreateEmergencyAlertDto } from './dto/create-emergency-alert.dto';
import { UpdateEmergencyAlertDto } from './dto/update-emergency-alert.dto';
import { EmergencyAlert } from './schemas/emergency-alerts.schema';

@ApiTags('emergency-alerts')
@Controller('emergency-alerts')
export class EmergencyAlertsController {
  constructor(private readonly emergencyAlertsService: EmergencyAlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new emergency alert' })
  @ApiBody({ type: CreateEmergencyAlertDto })
  @ApiResponse({ status: 201, description: 'The emergency alert has been successfully created.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createEmergencyAlertDto: CreateEmergencyAlertDto): Promise<EmergencyAlert> {
    return this.emergencyAlertsService.create(createEmergencyAlertDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all emergency alerts' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (Active, Resolved, Expired)' })
  @ApiResponse({ status: 200, description: 'Returns all emergency alerts based on filters.' })
  async findAll(
    @Query('hospitalId') hospitalId?: string,
    @Query('status') status?: string,
  ): Promise<EmergencyAlert[]> {
    return this.emergencyAlertsService.findAll(hospitalId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get emergency alert by ID' })
  @ApiParam({ name: 'id', description: 'Emergency Alert ID' })
  @ApiResponse({ status: 200, description: 'Returns the emergency alert.' })
  @ApiResponse({ status: 404, description: 'Emergency alert not found.' })
  async findOne(@Param('id') id: string): Promise<EmergencyAlert> {
    return this.emergencyAlertsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update emergency alert' })
  @ApiParam({ name: 'id', description: 'Emergency Alert ID' })
  @ApiBody({ type: UpdateEmergencyAlertDto })
  @ApiResponse({ status: 200, description: 'The emergency alert has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Emergency alert not found.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: string,
    @Body() updateEmergencyAlertDto: UpdateEmergencyAlertDto,
  ): Promise<EmergencyAlert> {
    return this.emergencyAlertsService.update(id, updateEmergencyAlertDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete emergency alert' })
  @ApiParam({ name: 'id', description: 'Emergency Alert ID' })
  @ApiResponse({ status: 200, description: 'The emergency alert has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Emergency alert not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.emergencyAlertsService.remove(id);
  }

  @Put(':id/resolve')
  @ApiOperation({ summary: 'Resolve emergency alert' })
  @ApiParam({ name: 'id', description: 'Emergency Alert ID' })
  @ApiQuery({ name: 'resolvedBy', required: true, description: 'ID or name of person resolving the alert' })
  @ApiResponse({ status: 200, description: 'The emergency alert has been successfully resolved.' })
  @ApiResponse({ status: 400, description: 'Alert is already resolved.' })
  @ApiResponse({ status: 404, description: 'Emergency alert not found.' })
  async resolveAlert(
    @Param('id') id: string,
    @Query('resolvedBy') resolvedBy: string,
  ): Promise<EmergencyAlert> {
    return this.emergencyAlertsService.resolveAlert(id, resolvedBy);
  }

  @Get('/count/:hospitalId')
  @ApiOperation({ summary: 'Get count of active alerts for a hospital' })
  @ApiParam({ name: 'hospitalId', description: 'Hospital ID' })
  @ApiResponse({ status: 200, description: 'Returns count of active alerts.' })
  async getActiveAlertCount(@Param('hospitalId') hospitalId: string): Promise<{ count: number }> {
    const count = await this.emergencyAlertsService.getActiveAlertCount(hospitalId);
    return { count };
  }

  @Get('/by-type/:hospitalId')
  @ApiOperation({ summary: 'Get alerts grouped by type for a hospital' })
  @ApiParam({ name: 'hospitalId', description: 'Hospital ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Returns alerts grouped by type.' })
  async getAlertsByType(
    @Param('hospitalId') hospitalId: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ): Promise<any> {
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;
    
    return this.emergencyAlertsService.getAlertsByType(hospitalId, startDate, endDate);
  }
}