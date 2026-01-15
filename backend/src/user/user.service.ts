import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { registerDto } from 'src/auth/dto/registerUser.dto';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { loginDto } from 'src/auth/dto/loginUser.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private UserModel: Model<User>) {}
  async createUser(registerUserDto: registerDto) {
    try {
      return await this.UserModel.create({
        fname: registerUserDto.fname,
        lname: registerUserDto.lname,
        email: registerUserDto.email,
        password: registerUserDto.password,
      });
    } catch (error) {
      const e = error as { code?: number };
      const Duplicate_Key_Error_Code = 11000;
      if (e.code === Duplicate_Key_Error_Code) {
        const key = Object.keys(error.keyValue)[0];
        throw new ConflictException(`${key} already exists`);
      }
      throw error;
    }
  }

  async loginUser(loginUserDto: loginDto) {
    const User = await this.UserModel.findOne({ email: loginUserDto.email });
    if (!User) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return User;
  }

  async getUserProfile(userId: string) {
    try {
      const User = await this.UserModel.findById(userId).select('-password');
      if (!User) {
        throw new NotFoundException('Invalid credentials');
      }
      return User;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid user ID format');
    }
  }
}
