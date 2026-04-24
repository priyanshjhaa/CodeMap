import { Controller, Post, Get, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("github/connect")
  connect() {
    return this.authService.getGithubConnection();
  }

  @Post('github/callback')
  async githubCallback(@Body() dto: any, @Res() res: Response) {
    try {
      const result = await this.authService.handleGithubCallback(dto);
      res.json(result);
    } catch (error: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: error.message
      });
    }
  }

  @Get('session')
  async getSession() {
    return { message: 'Session validation via NextAuth' };
  }

  @Post('signout')
  async signOut(@Res() res: Response) {
    res.json({ success: true });
  }
}
