import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from './dto/sign-up.dto';
import { User } from './types';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { instantiateValidated } from 'src/common/dto/validation.util';
import { ConfigService } from '@nestjs/config';

const USER_TRANSFORM_OPTIONS = {
  enableImplicitConversion: true,
  excludeExtraneousValues: true,
} as const;

@Injectable()
export class AuthService {
  private readonly rounds: number;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.rounds = Number(this.config.get<number | string>('BCRYPT_ROUNDS', 10));
  }

  async signup(signUpDto: SignUpDto) {
    const [byEmail, byUsername] = await Promise.all([
      this.users.findOne({ email: signUpDto.email }),
      this.users.findOne({ username: signUpDto.username }),
    ]);

    if (byEmail || byUsername) {
      throw new ConflictException(
        byEmail ? 'Email already in use' : 'Username already in use',
      );
    }

    const passwordHash = await bcrypt.hash(signUpDto.password, this.rounds);

    const user = await this.users.create({
      ...signUpDto,
      avatar: signUpDto.avatar ?? null,
      about: signUpDto.about ?? null,
      passwordHash,
    });

    return instantiateValidated(UserResponseDto, user, {
      transformOptions: USER_TRANSFORM_OPTIONS,
    });
  }

  async validateUser(username: string, password: string) {
    const user = await this.users.findOne({ username });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const hash = await this.users.findPasswordHashById(user.id);
    const ok = hash && (await bcrypt.compare(password, hash));
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(user: User) {
    const payload = { sub: user.id, username: user.username };
    const token = await this.jwt.signAsync(payload);
    return { access_token: token };
  }
}
