import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WishesService } from './wishes.service';
import { JwtAuthGuard } from 'src/auth/guards';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { CreateWishOfferDto } from './dto/create-wish-offer.dto';
import { AuthenticatedRequest } from '../auth/types';

const LAST_40_WISHES = 40;
const TOP_20_WISHES = 20;

@Controller('wishes')
export class WishesController {
  constructor(private readonly wishes: WishesService) {}

  @Get('last')
  async last() {
    return this.wishes.findRecentSummaries(LAST_40_WISHES);
  }

  @Get('top')
  async top() {
    return this.wishes.findTopSummaries(TOP_20_WISHES);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.wishes.getResponseForUser(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateWishDto) {
    return this.wishes.createForUserResponse(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWishDto,
  ) {
    return this.wishes.updateWithChecksResponse({ id }, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.wishes.removeWithChecksResponse({ id }, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/copy')
  async copy(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.wishes.copyToUserResponse(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/offers')
  createOffer(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateWishOfferDto,
  ) {
    return this.wishes.createOffer(id, req.user.id, dto);
  }
}
