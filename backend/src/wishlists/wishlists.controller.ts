import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { JwtAuthGuard } from 'src/auth/guards';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { AuthenticatedRequest } from '../auth/types';
import { WishlistResponseDto } from './dto/wishlist-response.dto';

@UseGuards(JwtAuthGuard)
@Controller(['wishlists', 'wishlistlists'])
export class WishlistsController {
  constructor(private readonly wishlists: WishlistsService) {}

  @Get()
  async getMany(
    @Query('topic') topic?: string,
  ): Promise<WishlistResponseDto[]> {
    return this.wishlists.findManyResponses(topic);
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateWishlistDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlists.createResponse(req.user.id, dto);
  }

  @Get(':id')
  async getOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WishlistResponseDto> {
    return this.wishlists.findOneResponse(id);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWishlistDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlists.updateOwnedResponse(id, req.user.id, dto);
  }

  @Delete(':id')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WishlistResponseDto> {
    return this.wishlists.removeOwnedResponse(id, req.user.id);
  }
}
