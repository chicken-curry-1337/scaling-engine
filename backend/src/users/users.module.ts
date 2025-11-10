import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { WishesModule } from 'src/wishes/wishes.module';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards';
import { UsersRepository } from './users.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), ConfigModule, WishesModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, JwtAuthGuard],
  exports: [UsersService, UsersRepository, TypeOrmModule],
})
export class UsersModule {}
