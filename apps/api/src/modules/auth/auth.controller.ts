import { Body, Controller, Get, Post } from '@nestjs/common';
import { successResponse } from '../../common/responses/api-response';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterOwnerBusinessDto } from './dto/register-owner-business.dto';
import { AuthenticatedUser } from './interfaces/auth-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() data: LoginDto) {
    return successResponse(await this.authService.login(data));
  }

  @Public()
  @Post('register-owner-business')
  async registerOwnerBusiness(@Body() data: RegisterOwnerBusinessDto) {
    return successResponse(await this.authService.registerOwnerBusiness(data));
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return successResponse(user);
  }
}
