import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from '../config';
import {
  ChangePasswordDto,
  CreateUserDto,
  LoginUserDto,
  UpdateUserDto,
} from './dto';
import type { JwtPayload } from './interfaces';

interface TokenValidationResponse {
  user: JwtPayload;
  token: string;
}

@Injectable()
export class AuthService {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  register(createUserDto: CreateUserDto) {
    return firstValueFrom(this.client.send('auth.register', createUserDto));
  }

  login(loginUserDto: LoginUserDto) {
    return firstValueFrom(this.client.send('auth.login', loginUserDto));
  }

  findAllUsers() {
    return firstValueFrom(this.client.send('auth.get-users', {}));
  }

  updateUser(userId: string, updateUserDto: UpdateUserDto) {
    return firstValueFrom(
      this.client.send('auth.update-user', {
        userId,
        updateUserDto,
      }),
    );
  }

  changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    return firstValueFrom(
      this.client.send('auth.change-password', {
        userId,
        changePasswordDto,
      }),
    );
  }

  logout(jti: string, exp: number) {
    return firstValueFrom(
      this.client.send('auth.logout', {
        jti,
        exp,
      }),
    );
  }

  logoutAll(userId: string) {
    return firstValueFrom(
      this.client.send('auth.logout-all', {
        userId,
      }),
    );
  }

  validateToken(token: string): Promise<TokenValidationResponse> {
    return firstValueFrom(
      this.client.send('auth.validate-token', {
        token,
      }),
    );
  }
}