// import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
// import { HospitalService } from './hospital.service';
// import { CreateHospitalDto } from './dto/create-hospital.dto';
// import { UpdateHospitalDto } from './dto/update-hospital.dto';
// import { Hospital } from './schemas/hospital.schema';

// @Controller('hospitals')
// export class HospitalController {
//   constructor(private readonly hospitalService: HospitalService) {}

//   @Post()
//   async create(@Body() createHospitalDto: CreateHospitalDto): Promise<Hospital> {
//     return this.hospitalService.create(createHospitalDto);
//   }

//   @Get()
//   async findAll(@Query() query: any): Promise<Hospital[]> {
//     return this.hospitalService.findAll(query);
//   }

//   @Get('nearby')
//   async findNearby(
//     @Query('latitude') latitude: number,
//     @Query('longitude') longitude: number,
//     @Query('maxDistance') maxDistance?: number,
//   ): Promise<Hospital[]> {
//     return this.hospitalService.findNearby(
//       parseFloat(latitude as any), 
//       parseFloat(longitude as any), 
//       maxDistance ? parseFloat(maxDistance as any) : undefined
//     );
//   }

//   @Get('find-by-coordinate')
//   async findByCoordinate(
//     @Query('latitude') latitude: number,
//     @Query('longitude') longitude: number
//   ): Promise<Hospital[]> {
//     return this.hospitalService.findByExactCoordinates(
//       parseFloat(latitude as any), 
//       parseFloat(longitude as any)
//     );
//   }

//   @Get(':id')
//   async findOne(@Param('id') id: string): Promise<Hospital> {
//     return this.hospitalService.findOne(id);
//   }

//   @Put(':id')
//   async update(
//     @Param('id') id: string,
//     @Body() updateHospitalDto: UpdateHospitalDto,
//   ): Promise<Hospital> {
//     return this.hospitalService.update(id, updateHospitalDto);
//   }

//   @Delete(':id')
//   async remove(@Param('id') id: string): Promise<void> {
//     return this.hospitalService.remove(id);
//   }
// }

import { Controller, Get, Post, Body, Param, Put, Delete, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HospitalService } from './hospital.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { Hospital } from './schemas/hospital.schema';

@ApiTags('Hospitals')
@Controller('hospitals')
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Post()
  @ApiOperation({ summary: 'Create new hospital with automatic admin account' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Hospital and admin account created successfully' 
  })
  async create(@Body() createHospitalDto: CreateHospitalDto) {
    const result = await this.hospitalService.create(createHospitalDto);
    
    return {
      success: true,
      message: 'Hospital created successfully with admin account',
      data: {
        hospital: {
          id: result.hospital._id,
          hospitalName: result.hospital.hospitalName,
          email: result.hospital.email,
          username: result.hospital.username,
          address: result.hospital.address,
        },
        admin: {
          id: result.adminStaff._id,
          name: result.adminStaff.name,
          email: result.adminStaff.email,
          position: result.adminStaff.position,
          department: result.adminStaff.department,
          permissions: result.adminStaff.permissions,
          emrAccessLevel: result.adminStaff.emrAccessLevel,
        },
        token: result.token,
      },
    };
  }

  @Get()
  async findAll(@Query() query: any): Promise<Hospital[]> {
    return this.hospitalService.findAll(query);
  }

  @Get('nearby')
  async findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('maxDistance') maxDistance?: number,
  ): Promise<Hospital[]> {
    return this.hospitalService.findNearby(
      parseFloat(latitude as any), 
      parseFloat(longitude as any), 
      maxDistance ? parseFloat(maxDistance as any) : undefined
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Hospital> {
    return this.hospitalService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateHospitalDto: UpdateHospitalDto,
  ): Promise<Hospital> {
    return this.hospitalService.update(id, updateHospitalDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.hospitalService.remove(id);
  }
}