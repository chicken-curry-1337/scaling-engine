import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { WishesService } from 'src/wishes/wishes.service';
import { FindUsersDto } from './dto/find-users.dto';
import { UserEntity } from './entities/user.entity';
import { AuthenticatedRequest } from '../auth/types';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards';
import {
  UserPublicResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly wishesService: WishesService,
  ) {}

  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    return this.usersService.getOwnProfileResponse(req.user.id);
  }

  @Patch('me')
  async updateMe(
    @Req() req: AuthenticatedRequest,
    @Body() userProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const { password, ...rest } = userProfileDto;
    const payload: Partial<UserEntity> = { ...rest } as Partial<UserEntity>;

    if (password) {
      const rounds = Number(this.configService.get('BCRYPT_ROUNDS', 10));
      const hash = await bcrypt.hash(password, rounds);
      payload.passwordHash = hash;
    }

    return this.usersService.updateOwnProfileResponse(req.user.id, payload);
  }

  @Get('me/wishes')
  async getOwnWishes(@Req() req: AuthenticatedRequest) {
    const wishes = await this.wishesService.findManyWithProgress({
      where: { owner: { id: req.user.id } },
    });
    return Promise.all(
      wishes.map((wish) =>
        this.wishesService.toResponse(wish, { includeHiddenOffers: true }),
      ),
    );
  }

  /** Поиск по username/email */
  @Post('find')
  async findMany(@Body() dto: FindUsersDto): Promise<UserPublicResponseDto[]> {
    return this.usersService.findPublicProfilesResponse(dto.query);
  }

  @Get(':username')
  async getPublicProfile(
    @Param('username') username: string,
  ): Promise<UserPublicResponseDto> {
    return this.usersService.getPublicProfileResponse(username);
  }

  @Get(':username/wishes')
  async getPublicWishes(@Param('username') username: string) {
    const user = await this.usersService.findOneOrFail({ username });
    const wishes = await this.wishesService.findManyWithProgress({
      where: { owner: { id: user.id } },
    });
    return Promise.all(
      wishes.map((wish) => this.wishesService.toResponse(wish)),
    );
  }
}
