import { Module } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { WishlistsController } from './wishlists.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistEntity } from './entities/wishlist.entity';
import { WishesModule } from '../wishes/wishes.module';
import { WishlistsRepository } from './wishlists.repository';

@Module({
  imports: [TypeOrmModule.forFeature([WishlistEntity]), WishesModule],
  controllers: [WishlistsController],
  providers: [WishlistsService, WishlistsRepository],
  exports: [TypeOrmModule, WishlistsRepository],
})
export class WishlistsModule {}
