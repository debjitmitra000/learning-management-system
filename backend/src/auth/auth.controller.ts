import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { registerDto } from './dto/registerUser.dto';
import { loginDto } from './dto/loginUser.dto';
import { AuthGuard } from './auth.guard';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService
    ) {}

    //register
    @Post('register')
    async register(@Body() registerUserDto: registerDto) {
        const Token = await this.authService.registerUser(registerUserDto);
        return Token;
    }

    //login 
    @Post('login')
    async login(@Body() loginUserDto: loginDto){
        const Token = await this.authService.loginUser(loginUserDto);
        return Token;
    }

    //profile
    @UseGuards(AuthGuard)
    @Get('profile')
    async getProfile(@Request() req) {

        const UserId = req.user.sub;
        
        const userProfile = await this.userService.getUserProfile(UserId);

        return userProfile;
    }
}
