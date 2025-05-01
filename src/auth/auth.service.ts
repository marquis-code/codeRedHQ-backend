
import { Injectable, UnauthorizedException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { Hospital, HospitalDocument } from '../hospital/schemas/hospital.schema';
import { LoginDto } from './dto/login.dto';
import { UserService } from 'src/user/user.service';
import { HospitalService } from 'src/hospital/hospital.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Hospital.name)
    private hospitalModel: Model<HospitalDocument>,
    private hospitalService: HospitalService,
    @Inject(forwardRef(() => HospitalService))
    @Inject(forwardRef(() => UserService))
    private UserService: UserService,
    private jwtService: JwtService,
  ) {}

  // async validateHospital(uuid: string, password: string): Promise<any> {
  //   const hospital = await this.hospitalModel.findOne({ uuid }).exec();

  //   if (!hospital) {
  //     throw new UnauthorizedException('Invalid credentials');
  //   }
    
  //   const isPasswordValid = await bcrypt.compare(password, hospital.password);
    
  //   if (!isPasswordValid) {
  //     throw new UnauthorizedException('Invalid credentials');
  //   }
    
  //   return {
  //     id: hospital._id,
  //     uuid: hospital.uuid,
  //     hospitalName: hospital.hospitalName,
  //   };
  // }

  generateJwtToken(payload: any): string {
    return this.jwtService.sign(payload);
  }
  
  async validateUser(email: string, pass: string): Promise<any> {
    const query = { email: email };
    const user = await this.UserService.findOne(query);
    if (!user) throw new NotFoundException('Email Does not exist');
    const isMatched = await this.comparePasswords(pass, user.password);
    if (!isMatched) throw new UnauthorizedException('Invalid Password');
    return user;
  }
  
  async login(loginDto: LoginDto): Promise<any> {
    const { usernameOrEmail, password } = loginDto;
    
    // Determine if this is a hospital login or user login
    if (usernameOrEmail) {
      // Hospital login
      const hospital = await this.validateHospital(usernameOrEmail, password);
      
      const payload = {
        sub: hospital.id,
        uuid: hospital.uuid,
        hospitalName: hospital.hospitalName,
        type: 'hospital'
      };
      
      return {
        access_token: this.jwtService.sign(payload),
        hospital,
        type: 'hospital'
      };
    } else {
      // User login
      const user = await this.validateUser(usernameOrEmail, password);
      
      const payload = {
        sub: user._id,
        email: user.email,
        name: user.name,
        type: 'user'
      };
      
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        },
        type: 'user'
      };
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async comparePasswords(
    password: string,
    hashedPassword: string
  ): Promise<any> {
    return bcrypt
      .compare(password, hashedPassword)
      .then((isMatch) => {
        if (isMatch) return true;
        return false;
      })
      .catch((err) => err);
  }

  async getHashedPassword(password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    });
  }

  // async validateHospital(usernameOrEmail: string, password: string): Promise<any> {
  //   const hospital = await this.hospitalService.validateHospital(usernameOrEmail, password);
    
  //   if (!hospital) {
  //     return null;
  //   }
    
  //   // Generate JWT token
  //   const payload = { 
  //     sub: hospital._id, 
  //     username: hospital.username,
  //     email: hospital.email,
  //     type: 'hospital'
  //   };
    
  //   return {
  //     access_token: this.jwtService.sign(payload),
  //     hospital: {
  //       id: hospital._id,
  //       username: hospital.username,
  //       email: hospital.email,
  //       hospitalName: hospital.hospitalName,
  //     }
  //   };
  // }
  async validateHospital(usernameOrEmail: string, password: string): Promise<any> {
    try {
      const hospital = await this.hospitalService.validateHospital(usernameOrEmail, password);
      
      if (!hospital) {
        return null;
      }
      
      // Generate JWT token
      const payload = { 
        sub: hospital._id, 
        username: hospital.username,
        email: hospital.email,
        type: 'hospital'
      };
      
      return {
        access_token: this.jwtService.sign(payload),
        hospital: {
          id: hospital._id,
          username: hospital.username,
          email: hospital.email,
          hospitalName: hospital.hospitalName,
        }
      };
    } catch (error) {
      console.error('Error validating hospital:', error);
      return null;
    }
  }
}