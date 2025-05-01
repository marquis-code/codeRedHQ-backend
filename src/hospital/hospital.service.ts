import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hospital, HospitalModel } from './schemas/hospital.schema';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';

@Injectable()
export class HospitalService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalModel>,
  ) {}

  async create(createHospitalDto: CreateHospitalDto): Promise<Hospital> {
    // Check if email already exists
    const existingEmail = await this.hospitalModel.findOne({ email: createHospitalDto.email }).exec();
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Generate a unique username based on hospital name and location
    const username = await this.generateUniqueUsername(
      createHospitalDto.hospitalName,
      createHospitalDto.address
    );

    // Create new hospital with generated username
    const newHospital = new this.hospitalModel({
      ...createHospitalDto,
      username,
    });

    return newHospital.save();
  }

  async findAll(query: any): Promise<Hospital[]> {
    return this.hospitalModel.find(query).exec();
  }

  async findOne(id: string): Promise<Hospital> {
    const hospital = await this.hospitalModel.findById(id).exec();
    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }
    return hospital;
  }

  async findByUsernameOrEmail(usernameOrEmail: string): Promise<Hospital> {
    const hospital = await this.hospitalModel.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    }).exec();
    
    if (!hospital) {
      throw new NotFoundException(`Hospital not found`);
    }
    
    return hospital;
  }

  async update(id: string, updateHospitalDto: UpdateHospitalDto): Promise<Hospital> {
    const hospital = await this.hospitalModel
      .findByIdAndUpdate(id, updateHospitalDto, { new: true })
      .exec();
    
    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }
    
    return hospital;
  }

  async remove(id: string): Promise<void> {
    const result = await this.hospitalModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }
  }

  async findNearby(
    latitude: number,
    longitude: number,
    maxDistance: number = 10000, // Default 10km
  ): Promise<Hospital[]> {
    // Find hospitals near the specified coordinates
    return this.hospitalModel.find({
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    }).exec();
  }

  private async generateUniqueUsername(hospitalName: string, address: string): Promise<string> {
    // Extract city or area from address (simplified approach)
    const addressParts = address.split(',');
    const locationPart = addressParts.length > 1 
      ? addressParts[addressParts.length - 2].trim() 
      : addressParts[0].trim();
    
    // Create base username by combining hospital name and location
    // Remove special characters, convert to lowercase, replace spaces with underscores
    let baseUsername = `${hospitalName}_${locationPart}`
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '_');
    
    // Check if username exists
    let username = baseUsername;
    let counter = 1;
    
    // Keep checking until we find a unique username
    while (await this.hospitalModel.findOne({ username }).exec()) {
      username = `${baseUsername}_${counter}`;
      counter++;
    }
    
    return username;
  }

  async validateHospital(usernameOrEmail: string, password: string): Promise<Hospital | null> {
    try {
      const hospital = await this.hospitalModel.findOne({
        $or: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }).exec();
      
      if (!hospital) {
        return null;
      }
      
      const isPasswordValid = await hospital.comparePassword(password);
      
      if (!isPasswordValid) {
        return null;
      }
      
      return hospital;
    } catch (error) {
      return null;
    }
  }
}