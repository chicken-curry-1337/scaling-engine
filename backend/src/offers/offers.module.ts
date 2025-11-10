import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { WishEntity } from '../wishes/entities/wish.entity';
import { OffersRepository } from './offers.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Offer, WishEntity])],
  controllers: [OffersController],
  providers: [OffersService, OffersRepository],
  exports: [OffersService, OffersRepository],
})
export class OffersModule {}
