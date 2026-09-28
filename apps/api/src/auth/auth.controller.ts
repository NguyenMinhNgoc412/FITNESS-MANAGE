import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser, Actor } from '../common/access';
import { parse, phone } from '../common/input';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards';
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') @HttpCode(200)
  login(@Body() input: unknown) {
    const dto = parse(z.object({ phone, password: z.string().min(1).max(72) }).strict(), input);
    return this.auth.login(dto.phone, dto.password);
  }
  @Post('refresh') @HttpCode(200)
  refresh(@Body() input: unknown) {
    return this.auth.refresh(parse(z.object({ refreshToken: z.string().min(1).max(2000) }).strict(), input).refreshToken);
  }
  @Post('logout') @UseGuards(JwtAuthGuard) @HttpCode(204)
  async logout(@CurrentUser() actor: Actor) { await this.auth.logout(actor.sessionId); }
  @Get('me') @UseGuards(JwtAuthGuard)
  me(@CurrentUser() actor: Actor) { return this.auth.profile(actor.sub); }
}
