import { Controller, Get, Post, Body, Param, Patch, Query, ParseFloatPipe, BadRequestException } from '@nestjs/common';
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

  // @Get('region')
  // async getSurgesInRegion(
  //   @Query('lat', ParseFloatPipe) latitude: number,
  //   @Query('lng', ParseFloatPipe) longitude: number,
  //   @Query('radius', ParseFloatPipe) radius: number,
  //   @Query('status') status?: string,
  // ) {
  //   const statusArray = status ? status.split(',') : undefined;
  //   return this.surgeService.getSurgesInRegion(
  //     latitude,
  //     longitude,
  //     radius,
  //     statusArray,
  //   );
  // }

  // @Get('region')
  // async getSurgesInRegion(
  //   @Query('lat', ParseFloatPipe) latitude: number,
  //   @Query('lng', ParseFloatPipe) longitude: number,
  //   @Query('radius', ParseFloatPipe) radius: number,
  //   @Query('status') status?: string,
  // ) {
  //   // Validate ranges
  //   if (latitude < -90 || latitude > 90) {
  //     throw new BadRequestException('Latitude must be between -90 and 90 degrees');
  //   }
    
  //   if (longitude < -180 || longitude > 180) {
  //     throw new BadRequestException('Longitude must be between -180 and 180 degrees');
  //   }
    
  //   if (radius <= 0) {
  //     throw new BadRequestException('Radius must be greater than 0');
  //   }

  //   const statusArray = status ? status.split(',') : undefined;
    
  //   return this.surgeService.getSurgesInRegion(
  //     latitude,
  //     longitude,
  //     radius,
  //     statusArray,
  //   );
  // }

  @Get('region')
async getSurgesInRegion(
  @Query('lat') latString: string,
  @Query('lng') lngString: string,
  @Query('radius') radiusString: string,
  @Query('status') status?: string,
) {
  // Debug: Log the raw query parameters
  console.log('Raw query params:', { latString, lngString, radiusString, status });
  
  // Manual parsing with better error messages
  const latitude = parseFloat(latString);
  const longitude = parseFloat(lngString);
  const radius = parseFloat(radiusString);
  
  // Check if parsing failed
  if (isNaN(latitude)) {
    throw new BadRequestException(`Invalid latitude: "${latString}" is not a valid number`);
  }
  
  if (isNaN(longitude)) {
    throw new BadRequestException(`Invalid longitude: "${lngString}" is not a valid number`);
  }
  
  if (isNaN(radius)) {
    throw new BadRequestException(`Invalid radius: "${radiusString}" is not a valid number`);
  }
  
  // Validate ranges
  if (latitude < -90 || latitude > 90) {
    throw new BadRequestException('Latitude must be between -90 and 90 degrees');
  }
       
  if (longitude < -180 || longitude > 180) {
    throw new BadRequestException('Longitude must be between -180 and 180 degrees');
  }
       
  if (radius <= 0) {
    throw new BadRequestException('Radius must be greater than 0');
  }

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