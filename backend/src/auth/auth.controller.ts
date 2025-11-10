import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto } from './dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { User } from './types';

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('/signup')
  signup(@Body() signUpDto: SignUpDto) {
    return this.auth.signup(signUpDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/signin')
  signin(
    @Body() _signInDto: SignInDto,
    @Req()
    req: {
      user: User;
    },
  ) {
    return this.auth.login(req.user);
  }
}
