import { Controller, Get, Query, ParseFloatPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { MapService } from './map.service';

@ApiTags('maps')
@Controller('maps')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('nearby-hospitals')
  @ApiOperation({ summary: 'Get nearby hospitals based on location' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Search radius in meters, defaults to 10000' })
  @ApiResponse({ status: 200, description: 'Returns nearby hospitals with bed availability information' })
  async getNearbyHospitals(
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('longitude', ParseFloatPipe) longitude: number,
    @Query('radius', new DefaultValuePipe(10000), ParseFloatPipe) radius: number,
  ) {
    return this.mapService.getNearbyHospitals(latitude, longitude, radius);
  }

  @Get('emergency-surge-points')
  @ApiOperation({ summary: 'Get emergency surge points (hospitals with high occupancy)' })
  @ApiResponse({ status: 200, description: 'Returns hospitals with high bed occupancy rates' })
  async getEmergencySurgePoints() {
    return this.mapService.getEmergencySurgePoints();
  }

  @Get('hospital-density-heatmap')
  @ApiOperation({ summary: 'Get hospital density heatmap data' })
  @ApiResponse({ status: 200, description: 'Returns heatmap data based on hospital density and bed availability' })
  async getHospitalDensityHeatmap() {
    return this.mapService.getHospitalDensityHeatmap();
  }
}