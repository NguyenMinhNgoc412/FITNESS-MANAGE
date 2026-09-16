import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto } from './dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') @HttpCode(200) login(@Body() dto: LoginDto) { return this.auth.login(dto.email, dto.password); }
  @Post('refresh') @HttpCode(200) refresh(@Body() dto: RefreshDto) { return this.auth.refresh(dto.refreshToken); }
  @Post('logout') @UseGuards(JwtAuthGuard) @HttpCode(204) async logout(@CurrentUser() user: AuthUser) { await this.auth.logout(user.sessionId); }
}
