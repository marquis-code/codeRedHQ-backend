import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { HospitalDocument } from '../hospital/schemas/hospital.schema';
import { LoginDto } from './dto/login.dto';
import { UserService } from 'src/user/user.service';
import { HospitalService } from 'src/hospital/hospital.service';
export declare class AuthService {
    private hospitalModel;
    private hospitalService;
    private UserService;
    private jwtService;
    constructor(hospitalModel: Model<HospitalDocument>, hospitalService: HospitalService, UserService: UserService, jwtService: JwtService);
    generateJwtToken(payload: any): string;
    validateUser(email: string, pass: string): Promise<any>;
    login(loginDto: LoginDto): Promise<any>;
    validateToken(token: string): Promise<any>;
    comparePasswords(password: string, hashedPassword: string): Promise<any>;
    getHashedPassword(password: string): Promise<any>;
    validateHospital(usernameOrEmail: string, password: string): Promise<any>;
}
