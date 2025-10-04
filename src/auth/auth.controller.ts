import { Body, Controller, Get, Patch, Post, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  CreateUserDto,
  LoginUserDto,
  UpdateUserDto,
} from './dto';
import { Auth, GetUser } from './decorators';
import { ValidRoles, JwtPayload } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('users')
  @Auth(ValidRoles.ADMIN)
  findAllUsers() {
    return this.authService.findAllUsers();
  }

  @Get('check-status')
  @Auth()
  checkStatus(@Req() request: Request) {
    const validation = request['authValidation'] as { user: JwtPayload; token: string };
    return validation;
  }

  @Patch('update-user')
  @Auth()
  updateUser(
    @GetUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.updateUser(userId, updateUserDto);
  }

  @Put('change-password')
  @Auth()
  changePassword(
    @GetUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('logout')
  @Auth()
  async logout(@Req() request: Request) {
    const { user } = request['authValidation'] as { user: JwtPayload; token: string };
    await this.authService.logout(user.jti, user.exp);
    return { message: 'Logout successful' };
  }

  @Post('logout-all')
  @Auth()
  async logoutAll(@GetUser('id') userId: string) {
    await this.authService.logoutAll(userId);
    return { message: 'All sessions logged out successfully' };
  }
}