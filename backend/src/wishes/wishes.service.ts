import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindManyOptions, FindOptionsWhere } from 'typeorm';
import { WishEntity } from './entities/wish.entity';
import { OffersService } from '../offers/offers.service';
import { UserEntity } from '../users/entities/user.entity';
import { WishesRepository } from './wishes.repository';
import {
  WishResponseDto,
  WishSummaryResponseDto,
  WishWithRelations,
} from './dto/wish-response.dto';
import { instantiateValidated } from '../common/dto/validation.util';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { CreateWishOfferDto } from './dto/create-wish-offer.dto';

const WISH_TRANSFORM_OPTIONS = {
  enableImplicitConversion: true,
  excludeExtraneousValues: true,
} as const;

@Injectable()
export class WishesService {
  constructor(
    private readonly wishesRepository: WishesRepository,
    private readonly offers: OffersService,
  ) {}

  async createForUser(ownerId: number, dto: CreateWishDto) {
    this.ensureRequiredFields(dto);

    const owner = new UserEntity();
    owner.id = ownerId;

    const entity = this.wishesRepository.create({
      ...dto,
      owner,
    });

    const saved = await this.wishesRepository.save(entity);
    const created = await this.getWithProgress({ id: saved.id });
    if (!created) throw new NotFoundException('Wish not found');
    return created;
  }

  async findOne(where: FindOptionsWhere<WishEntity>) {
    return this.wishesRepository.findOne(where, {
      relations: { owner: true, offers: { user: true } },
    });
  }

  async findMany(options?: FindManyOptions<WishEntity>) {
    const baseRelations = options?.relations ?? {};
    const relations = {
      ...baseRelations,
      owner: true,
      offers: { user: true },
    };
    const merged: FindManyOptions<WishEntity> = {
      ...(options ?? {}),
      relations,
    };
    return this.wishesRepository.find(merged);
  }

  async findRecentSummaries(limit: number) {
    const wishes = await this.findManyWithProgress({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return Promise.all(wishes.map((wish) => this.toPartialResponse(wish)));
  }

  async findTopSummaries(limit: number) {
    const wishes = await this.findManyWithProgress({
      order: { copied: 'DESC' },
      take: limit,
    });
    return Promise.all(wishes.map((wish) => this.toPartialResponse(wish)));
  }

  async updateOne(
    where: FindOptionsWhere<WishEntity>,
    data: Partial<WishEntity>,
  ) {
    const entity = await this.findOne(where);
    if (!entity) throw new NotFoundException('Wish not found');
    Object.assign(entity, data);
    return this.wishesRepository.save(entity);
  }

  async removeOne(where: FindOptionsWhere<WishEntity>) {
    const entity = await this.findOne(where);
    if (!entity) throw new NotFoundException('Wish not found');
    await this.wishesRepository.remove(entity);
  }

  async updateWithChecks(
    where: FindOptionsWhere<WishEntity>,
    dto: UpdateWishDto,
    userId: number,
  ) {
    const wish = await this.findOne(where);
    if (!wish) throw new NotFoundException('Wish not found');

    if (wish.owner.id !== userId) {
      throw new ForbiddenException('You cannot edit this wish');
    }

    const hasOffers = Array.isArray(wish.offers) && wish.offers.length > 0;
    if (hasOffers && dto.price !== undefined && dto.price !== wish.price) {
      throw new ForbiddenException(
        'Cannot change price after contributions exist',
      );
    }

    const nextLink = dto.link ?? wish.link;
    const nextImage = dto.image ?? wish.image;
    this.ensureRequiredFields({ link: nextLink, image: nextImage });

    const payload: Partial<WishEntity> = {
      ...dto,
      link: nextLink ?? undefined,
      image: nextImage ?? undefined,
    };

    return this.updateOne(where, payload);
  }

  async removeWithChecks(where: FindOptionsWhere<WishEntity>, userId: number) {
    const wish = await this.findOne(where);
    if (!wish) throw new NotFoundException('Wish not found');

    if (wish.owner.id !== userId) {
      throw new ForbiddenException('You cannot delete this wish');
    }

    const hasOffers = Array.isArray(wish.offers) && wish.offers.length > 0;
    if (hasOffers) {
      throw new ForbiddenException('Cannot delete wish with existing offers');
    }

    return this.removeOne(where);
  }

  /** Возвращает подарок + вычисленный progress (raised) */
  async getWithProgress(where: FindOptionsWhere<WishEntity>) {
    const wish = await this.findOne(where);
    if (!wish) throw new NotFoundException('Wish not found');
    return this.ensureRaised(wish);
  }

  async findManyWithProgress(options?: FindManyOptions<WishEntity>) {
    const wishes = await this.findMany(options);
    return Promise.all(wishes.map((w) => this.ensureRaised(w)));
  }

  /** Копирование чужого подарка в профиль пользователя */
  async copyToUser(sourceWishId: number, targetUserId: number) {
    const src = await this.findOne({ id: sourceWishId });
    if (!src) throw new NotFoundException('Wish not found');

    // инкрементируем счётчик copied у исходного подарка
    this.ensureRequiredFields({
      link: src.link ?? undefined,
      image: src.image ?? undefined,
    });

    const nextCopied = (Number(src.copied) || 0) + 1;
    await this.updateOne({ id: src.id }, { copied: nextCopied });

    return this.createForUser(targetUserId, {
      name: src.name,
      link: src.link ?? undefined,
      image: src.image ?? undefined,
      price: src.price,
      description: src.description ?? undefined,
    });
  }

  /** Создание заявки на скидывание */
  async createOffer(wishId: number, userId: number, dto: CreateWishOfferDto) {
    await this.offers.createContribution(userId, {
      amount: dto.amount,
      hidden: dto.hidden ?? false,
      wishId,
    });
    const wish = await this.getWithProgress({ id: wishId });
    if (!wish) throw new NotFoundException('Wish not found');
    const includeHiddenOffers = wish.owner.id === userId;
    return this.toResponse(wish, { includeHiddenOffers });
  }

  async getResponseForUser(id: number, requesterId: number) {
    const wish = await this.getWithProgress({ id });
    const includeHiddenOffers = wish.owner.id === requesterId;
    return this.toResponse(wish, { includeHiddenOffers });
  }

  async createForUserResponse(ownerId: number, dto: CreateWishDto) {
    const wish = await this.createForUser(ownerId, dto);
    return this.toResponse(wish, { includeHiddenOffers: true });
  }

  async updateWithChecksResponse(
    where: FindOptionsWhere<WishEntity>,
    dto: UpdateWishDto,
    userId: number,
  ) {
    const updated = await this.updateWithChecks(where, dto, userId);
    const wish = await this.getWithProgress({ id: updated.id });
    return this.toResponse(wish, { includeHiddenOffers: true });
  }

  async removeWithChecksResponse(
    where: FindOptionsWhere<WishEntity>,
    userId: number,
  ) {
    const wish = await this.getWithProgress(where);
    await this.removeWithChecks(where, userId);
    return this.toResponse(wish, { includeHiddenOffers: true });
  }

  async copyToUserResponse(sourceWishId: number, targetUserId: number) {
    const copy = await this.copyToUser(sourceWishId, targetUserId);
    const wish = await this.getWithProgress({ id: copy.id });
    const includeHiddenOffers = wish.owner.id === targetUserId;
    return this.toResponse(wish, { includeHiddenOffers });
  }

  async toResponse(
    wish: WishWithRelations,
    options: { includeHiddenOffers?: boolean } = {},
  ): Promise<WishResponseDto> {
    const withRaised = await this.ensureRaised(wish);
    const { includeHiddenOffers = false } = options;
    const offers = (withRaised.offers ?? []).filter(
      (offer) => includeHiddenOffers || !offer.hidden,
    ) as WishWithRelations['offers'];

    const payload = {
      ...withRaised,
      offers,
    } as WishWithRelations;

    return instantiateValidated(WishResponseDto, payload, {
      transformOptions: WISH_TRANSFORM_OPTIONS,
    });
  }

  async toPartialResponse(
    wish: WishWithRelations,
  ): Promise<WishSummaryResponseDto> {
    const withRaised = await this.ensureRaised(wish);
    return instantiateValidated(WishSummaryResponseDto, withRaised, {
      transformOptions: WISH_TRANSFORM_OPTIONS,
    });
  }

  private async ensureRaised(wish: WishWithRelations) {
    if (wish.raised !== undefined) return wish;
    const raised = await this.offers.getRaisedAmount(wish.id);
    return { ...wish, raised } as WishWithRelations;
  }

  private ensureRequiredFields(dto: {
    link?: string | null;
    image?: string | null;
  }) {
    if (!dto.link) {
      throw new BadRequestException('Link is required');
    }
    if (!dto.image) {
      throw new BadRequestException('Image is required');
    }
  }
}
