// import { Controller, Get, Post, Body, Param, Put, Delete, Query, HttpStatus, HttpCode } from '@nestjs/common';
// import { BedspaceService } from './bedspace.service';
// import { CreateBedspaceDto } from './dto/create-bedspace.dto';
// import { UpdateBedspaceDto } from './dto/update-bedspace.dto';
// import { BedspaceDocument } from './schemas/bedspace.schema';

// @Controller('bedspaces')
// export class BedspaceController {
//   constructor(private readonly bedspaceService: BedspaceService) {}

//   @Post()
//   @HttpCode(HttpStatus.CREATED)
//   async create(@Body() createBedspaceDto: CreateBedspaceDto): Promise<BedspaceDocument> {
//     return this.bedspaceService.create(createBedspaceDto);
//   }


//   @Get()
// async findAll(@Query('hospitalId') hospitalId?: string): Promise<BedspaceDocument[]> {
//   return this.bedspaceService.findAllBedspaces(hospitalId);
// }

//   @Get(':id')
//   async findOne(@Param('id') id: string): Promise<BedspaceDocument> {
//     return this.bedspaceService.findOne(id);
//   }

//   @Put(':id')
//   async update(
//     @Param('id') id: string,
//     @Body() updateBedspaceDto: UpdateBedspaceDto,
//   ): Promise<BedspaceDocument> {
//     return this.bedspaceService.update(id, updateBedspaceDto);
//   }

//   @Delete(':id')
//   @HttpCode(HttpStatus.NO_CONTENT)
//   async remove(@Param('id') id: string): Promise<void> {
//     return this.bedspaceService.remove(id);
//   }

//   @Get('hospital/:hospitalId/summary')
//   async getHospitalSummary(@Param('hospitalId') hospitalId: string): Promise<any> {
//     return this.bedspaceService.getHospitalSummary(hospitalId);
//   }

//   @Put(':id/availability')
//   async updateBedAvailability(
//     @Param('id') id: string,
//     @Query('action') action: string,
//   ): Promise<BedspaceDocument> {
//     const isDischarge = action === 'discharge';
//     return this.bedspaceService.updateBedAvailability(id, isDischarge);
//   }
// }

import { 
  Controller, Get, Post, Body, Param, Put, Delete, Query, 
  HttpStatus, HttpCode, UseGuards, Req, Ip, Headers 
} from '@nestjs/common';
import { BedspaceService } from './bedspace.service';
import { CreateBedspaceDto } from './dto/create-bedspace.dto';
import { UpdateBedspaceDto } from './dto/update-bedspace.dto';
import { BedspaceDocument } from './schemas/bedspace.schema';

@Controller('bedspaces')
export class BedspaceController {
  constructor(private readonly bedspaceService: BedspaceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBedspaceDto: CreateBedspaceDto): Promise<BedspaceDocument> {
    return this.bedspaceService.create(createBedspaceDto);
  }

  @Get()
  async findAll(@Query('hospitalId') hospitalId?: string): Promise<BedspaceDocument[]> {
    return this.bedspaceService.findAllBedspaces(hospitalId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BedspaceDocument> {
    return this.bedspaceService.findOne(id);
  }

  // Staff-managed bedspace updates
  @Put(':id/staff-update')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard) // Require authentication
  async updateByStaff(
    @Param('id') id: string,
    @Body() body: {
      availableBeds?: number;
      occupiedBeds?: number;
      notes?: string;
    },
    @Req() req: any, // Contains authenticated staff info
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<BedspaceDocument> {
    const staffId = req.user?.sub; // From JWT token

    // Get location from request if available
    const location = req.body.location
      ? { latitude: req.body.location.latitude, longitude: req.body.location.longitude }
      : undefined;

    return this.bedspaceService.updateByStaff(
      id,
      staffId,
      {
        availableBeds: body.availableBeds,
        occupiedBeds: body.occupiedBeds,
        notes: body.notes,
      },
      {
        ipAddress: ip,
        userAgent,
        location,
      }
    );
  }

  // Quick actions for staff
  @Post(':id/admit')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  async admitPatient(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<BedspaceDocument> {
    const staffId = req.user?.sub;
    const location = req.body.location;

    return this.bedspaceService.admitPatient(id, staffId, {
      ipAddress: ip,
      userAgent,
      location,
      notes: body.notes,
    });
  }

  @Post(':id/discharge')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  async dischargePatient(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Req() req: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<BedspaceDocument> {
    const staffId = req.user?.sub;
    const location = req.body.location;

    return this.bedspaceService.dischargePatient(id, staffId, {
      ipAddress: ip,
      userAgent,
      location,
      notes: body.notes,
    });
  }

  @Get(':id/history')
  async getBedspaceHistory(@Param('id') id: string): Promise<any> {
    return this.bedspaceService.getBedspaceHistory(id);
  }

  // Original endpoints
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBedspaceDto: UpdateBedspaceDto,
  ): Promise<BedspaceDocument> {
    return this.bedspaceService.update(id, updateBedspaceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.bedspaceService.remove(id);
  }

  @Get('hospital/:hospitalId/summary')
  async getHospitalSummary(@Param('hospitalId') hospitalId: string): Promise<any> {
    return this.bedspaceService.getHospitalSummary(hospitalId);
  }

  @Put(':id/availability')
  async updateBedAvailability(
    @Param('id') id: string,
    @Query('action') action: string,
  ): Promise<BedspaceDocument> {
    const isDischarge = action === 'discharge';
    return this.bedspaceService.updateBedAvailability(id, isDischarge);
  }
}