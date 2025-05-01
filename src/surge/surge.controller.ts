import { Controller, Get, Post, Body, Param, Patch, Query } from '@nestjs/common';
import { SurgeService } from './surge.service';

@Controller('surges')
export class SurgeController {
  constructor(private readonly surgeService: SurgeService) {}

  @Post()
  async createSurge(
    @Body() createSurgeDto: {
      hospitalId: string;
      latitude: number;
      longitude: number;
      address?: string;
      emergencyType?: string;
      description?: string;
      metadata?: Record<string, any>;
    },
  ) {
    return this.surgeService.createSurge(createSurgeDto);
  }

  @Patch(':id/status')
  async updateSurgeStatus(
    @Param('id') id: string,
    @Body() updateDto: { status: string; metadata?: Record<string, any> },
  ) {
    return this.surgeService.updateSurgeStatus(
      id,
      updateDto.status,
      updateDto.metadata,
    );
  }

  @Get('hospital/:hospitalId')
  async getSurgesByHospital(
    @Param('hospitalId') hospitalId: string,
    @Query('status') status?: string,
  ) {
    const statusArray = status ? status.split(',') : undefined;
    return this.surgeService.getSurgesByHospital(hospitalId, statusArray);
  }

  @Get('region')
  async getSurgesInRegion(
    @Query('lat') latitude: number,
    @Query('lng') longitude: number,
    @Query('radius') radius: number,
    @Query('status') status?: string,
  ) {
    const statusArray = status ? status.split(',') : undefined;
    return this.surgeService.getSurgesInRegion(
      latitude,
      longitude,
      radius,
      statusArray,
    );
  }

  @Get(':id')
  async getSurgeById(@Param('id') id: string) {
    return this.surgeService.getSurgeById(id);
  }
}