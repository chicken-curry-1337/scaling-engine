import {
  BadRequestException,
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
import { OffersService } from './offers.service';
import { JwtAuthGuard } from 'src/auth/guards';
import { CreateOfferRequestDto, UpdateOfferDto } from './dto';
import { AuthenticatedRequest } from '../auth/types';

@UseGuards(JwtAuthGuard)
@Controller('offers')
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('wishId') wishId?: string,
  ) {
    const parsed = wishId ? Number(wishId) : undefined;
    if (wishId && Number.isNaN(parsed)) {
      throw new BadRequestException('wishId must be a number');
    }
    return this.offers.findVisibleResponses(req.user.id, parsed);
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateOfferRequestDto,
  ) {
    return this.offers.createContributionResponse(req.user.id, {
      amount: dto.amount,
      hidden: dto.hidden ?? false,
      wishId: dto.itemId,
    });
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOfferDto,
  ) {
    return this.offers.updateOwnedResponse(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.offers.removeOwned(id, req.user.id);
  }

  @Get(':id')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.offers.findOneResponse(id, req.user.id);
  }
}
