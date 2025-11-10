import { Module } from '@nestjs/common';
import { WishesService } from './wishes.service';
import { WishesController } from './wishes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishEntity } from './entities/wish.entity';
import { OffersModule } from '../offers/offers.module';
import { JwtAuthGuard } from '../auth/guards';
import { WishesRepository } from './wishes.repository';

@Module({
  imports: [TypeOrmModule.forFeature([WishEntity]), OffersModule],
  controllers: [WishesController],
  providers: [WishesService, WishesRepository, JwtAuthGuard],
  exports: [WishesService, WishesRepository],
})
export class WishesModule {}
