import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindManyOptions, FindOptionsWhere } from 'typeorm';
import { Offer, OfferStatus } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { QueryOfferDto } from './dto/query-offer.dto';
import { OfferResponseDto, OfferWithRelations } from './dto/offer-response.dto';
import { instantiateValidated } from '../common/dto/validation.util';
import { WishEntity } from '../wishes/entities/wish.entity';
import { UserEntity } from '../users/entities/user.entity';
import { OffersRepository } from './offers.repository';

@Injectable()
export class OffersService {
  private static readonly RESPONSE_TRANSFORM_OPTIONS = {
    enableImplicitConversion: true,
    excludeExtraneousValues: true,
  } as const;

  constructor(private readonly offersRepository: OffersRepository) {}

  async createOne(dto: CreateOfferDto) {
    if (dto.userId == null) {
      throw new BadRequestException('userId is required');
    }
    if (dto.wishId == null) {
      throw new BadRequestException('wishId is required');
    }
    this.ensureAmountPositive(dto.amount);

    await this.ensureContributionAllowed(dto.userId, dto.wishId, dto.amount);

    const user = new UserEntity();
    user.id = dto.userId;
    const wishEntity = new WishEntity();
    wishEntity.id = dto.wishId;

    const entity = this.offersRepository.create({
      amount: dto.amount,
      hidden: dto.hidden ?? false,
      status: OfferStatus.ACTIVE,
      user,
      wish: wishEntity,
    });
    const saved = await this.offersRepository.save(entity);
    const created = await this.findOne({ id: saved.id });
    if (!created) throw new NotFoundException('Offer not found');
    return created;
  }

  async createContribution(userId: number, dto: CreateOfferDto) {
    return this.createOne({
      amount: dto.amount,
      hidden: dto.hidden ?? false,
      wishId: dto.wishId,
      userId,
    });
  }

  async findVisibleResponses(
    userId: number,
    wishId?: number,
  ): Promise<OfferResponseDto[]> {
    const list = await (wishId ? this.findMany({ wishId }) : this.findMany());
    const visible = list.filter((offer) => {
      if (!offer.hidden) return true;
      const isContributor = offer.user?.id === userId;
      const isOwner = offer.wish?.owner?.id === userId;
      return isContributor || isOwner;
    });
    return Promise.all(visible.map((offer) => this.toResponse(offer))).then(
      (responses) => responses.filter(Boolean) as OfferResponseDto[],
    );
  }

  async createContributionResponse(
    userId: number,
    dto: CreateOfferDto,
  ): Promise<OfferResponseDto> {
    const offer = await this.createContribution(userId, dto);
    const response = await this.toResponse(offer);
    if (!response) throw new NotFoundException('Offer not found');
    return response;
  }

  async updateOwnedResponse(
    id: number,
    ownerId: number,
    dto: UpdateOfferDto,
  ): Promise<OfferResponseDto> {
    const offer = await this.updateOwned(id, ownerId, dto);
    const response = await this.toResponse(offer);
    if (!response) throw new NotFoundException('Offer not found');
    return response;
  }

  async findOneResponse(
    id: number,
    requesterId: number,
  ): Promise<OfferResponseDto> {
    const offer = await this.findOne({ id });
    if (!offer) throw new NotFoundException('Offer not found');
    if (
      offer.hidden &&
      offer.user.id !== requesterId &&
      offer.wish.owner.id !== requesterId
    ) {
      throw new ForbiddenException('Offer is hidden');
    }
    const response = await this.toResponse(offer);
    if (!response) throw new NotFoundException('Offer not found');
    return response;
  }

  async findOne(query: QueryOfferDto) {
    const where = this.toWhere(query);
    return this.offersRepository.findOne(where, {
      relations: { user: true, wish: { owner: true } },
    });
  }

  async findMany(query?: QueryOfferDto) {
    const where = this.toWhere(query);
    const options: FindManyOptions<Offer> = {
      where,
      relations: { user: true, wish: { owner: true } },
    };
    return this.offersRepository.find(options);
  }

  async updateOne(query: QueryOfferDto, dto: UpdateOfferDto) {
    const entity = await this.findOneOrFail(query);
    this.applyUpdates(entity, dto, { allowReassign: true });
    await this.offersRepository.save(entity);
    const updated = await this.findOne({ id: entity.id });
    if (!updated) throw new NotFoundException('Offer not found');
    return updated;
  }

  async updateOwned(id: number, userId: number, dto: UpdateOfferDto) {
    const entity = await this.findOneOrFail({ id });
    this.assertOwnedBy(entity, userId);

    if (dto.userId !== undefined || dto.wishId !== undefined) {
      throw new ForbiddenException('Cannot reassign offer owner or wish');
    }

    if (dto.amount !== undefined) {
      this.ensureAmountPositive(dto.amount);
      const wish = await this.offersRepository.findWishWithOwner(
        entity.wish.id,
      );
      if (!wish) throw new NotFoundException('Wish not found');

      const currentRaised = await this.getRaisedAmount(entity.wish.id);
      const otherRaised = currentRaised - Number(entity.amount);
      const price = Number(wish.price);
      const remaining = price - otherRaised;
      if (remaining <= 0) {
        throw new ForbiddenException('This wish is already fully funded');
      }
      if (dto.amount > remaining) {
        throw new ForbiddenException('Contribution exceeds remaining amount');
      }

      entity.amount = dto.amount;
    }

    if (dto.hidden !== undefined) {
      entity.hidden = dto.hidden;
    }

    if (dto.status !== undefined) {
      entity.status = dto.status;
    }

    await this.offersRepository.save(entity);
    const updated = await this.findOne({ id: entity.id });
    if (!updated) throw new NotFoundException('Offer not found');
    return updated;
  }

  async removeOne(query: QueryOfferDto) {
    const entity = await this.findOneOrFail(query);
    await this.offersRepository.remove(entity);
  }

  async removeOwned(id: number, userId: number): Promise<never> {
    const entity = await this.findOneOrFail({ id });
    this.assertOwnedBy(entity, userId);
    throw new ForbiddenException('You cannot delete this offer');
  }

  async getRaisedAmount(wishId: number): Promise<number> {
    return this.offersRepository.getRaisedAmount(wishId);
  }

  assertOwnedBy(offer: Offer, userId: number) {
    if (offer.user.id !== userId)
      throw new ForbiddenException('Not your offer');
  }

  private toWhere(query?: QueryOfferDto): FindOptionsWhere<Offer> {
    if (!query) return {};
    const where: FindOptionsWhere<Offer> = {};
    if (query.id !== undefined) where.id = query.id;
    if (query.userId !== undefined)
      where.user = { id: query.userId } as FindOptionsWhere<UserEntity>;
    if (query.wishId !== undefined)
      where.wish = { id: query.wishId } as FindOptionsWhere<WishEntity>;
    if (query.status !== undefined) where.status = query.status;
    if (query.hidden !== undefined) where.hidden = query.hidden;
    return where;
  }

  private async findOneOrFail(query: QueryOfferDto) {
    const entity = await this.findOne(query);
    if (!entity) throw new NotFoundException('Offer not found');
    return entity;
  }

  private applyUpdates(
    entity: Offer,
    dto: UpdateOfferDto,
    options: { allowReassign?: boolean } = {},
  ) {
    if (dto.hidden !== undefined) entity.hidden = dto.hidden;
    if (dto.amount !== undefined) {
      if (dto.amount !== entity.amount) {
        throw new ForbiddenException('Cannot modify offer amount');
      }
    }
    if (dto.status !== undefined) entity.status = dto.status;
    if (options.allowReassign && dto.userId !== undefined) {
      const user = new UserEntity();
      user.id = dto.userId;
      entity.user = user;
    }
    if (options.allowReassign && dto.wishId !== undefined) {
      const wish = new WishEntity();
      wish.id = dto.wishId;
      entity.wish = wish;
    }
  }

  private ensureAmountPositive(amount?: number) {
    if (amount == null || amount <= 0) {
      throw new BadRequestException('amount must be positive');
    }
  }

  private async ensureContributionAllowed(
    userId: number,
    wishId: number,
    amount: number,
  ): Promise<void> {
    const wish = await this.offersRepository.findWishWithOwner(wishId);
    if (!wish) throw new NotFoundException('Wish not found');
    if (wish.owner.id === userId) {
      throw new ForbiddenException('You cannot contribute to your own wish');
    }

    const raised = await this.getRaisedAmount(wishId);
    const price = Number(wish.price);
    const remaining = price - raised;
    if (remaining <= 0) {
      throw new ForbiddenException('This wish is already fully funded');
    }
    if (amount > remaining) {
      throw new ForbiddenException('Contribution exceeds remaining amount');
    }

    return;
  }

  private async toResponse(
    offer: Offer | null,
  ): Promise<OfferResponseDto | null> {
    if (!offer) return null;
    await this.attachRaisedAmount(offer);
    return instantiateValidated(OfferResponseDto, offer as OfferWithRelations, {
      transformOptions: OffersService.RESPONSE_TRANSFORM_OPTIONS,
    });
  }

  private async attachRaisedAmount(offer: Offer) {
    if (!offer.wish) return;
    const raised = await this.getRaisedAmount(offer.wish.id);
    (offer.wish as OfferWithRelations['wish'] & { raised?: number }).raised =
      raised;
  }
}
