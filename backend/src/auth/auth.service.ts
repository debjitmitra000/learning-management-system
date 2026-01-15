import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { registerDto } from './dto/registerUser.dto';
import { loginDto } from './dto/loginUser.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService
    ) {}

    async registerUser(registerUserDto: registerDto) {
        console.log(registerUserDto);
        const hash = await bcrypt.hash(registerUserDto.password,10)

        const User = await this.userService.createUser({...registerUserDto,password:hash})

        const payload = {sub: User._id, name: User.fname, username: User.email, role: User.role}

        const token = await this.jwtService.signAsync(payload)

        return {access_token: token};
    }

    async loginUser(loginUserDto: loginDto){
        const User = await this.userService.loginUser(loginUserDto);
        
        const result = await bcrypt.compare(loginUserDto.password, User.password);

        if(!result){
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {sub: User._id, name: User.fname, username: User.email, role: User.role}

        const token = await this.jwtService.signAsync(payload);

        return {access_token: token};
    }

}
