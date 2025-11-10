import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { WishlistEntity } from './entities/wishlist.entity';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { QueryWishlistDto } from './dto/query-wishlist.dto';
import { UserEntity } from '../users/entities/user.entity';
import { WishlistResponseDto } from './dto/wishlist-response.dto';
import { instantiateValidated } from '../common/dto/validation.util';
import { WishesService } from '../wishes/wishes.service';
import { WishSummaryResponseDto } from '../wishes/dto/wish-response.dto';
import { WishlistsRepository } from './wishlists.repository';
import { WishesRepository } from '../wishes/wishes.repository';

@Injectable()
export class WishlistsService {
  private static readonly TRANSFORM_OPTIONS = {
    enableImplicitConversion: true,
    excludeExtraneousValues: true,
  } as const;

  constructor(
    private readonly wishlistsRepository: WishlistsRepository,
    private readonly wishesRepository: WishesRepository,
    private readonly wishesService: WishesService,
  ) {}

  async create(
    ownerId: number,
    dto: CreateWishlistDto,
  ): Promise<WishlistEntity> {
    const owner = new UserEntity();
    owner.id = ownerId;
    const entity = this.wishlistsRepository.create({
      name: dto.name,
      image: dto.image ?? null,
      owner,
    });
    if (dto.itemsId?.length) {
      entity.items = await this.loadItems(dto.itemsId);
    }
    const saved = await this.wishlistsRepository.save(entity);
    return this.findOneOrFail({ id: saved.id });
  }

  async createResponse(ownerId: number, dto: CreateWishlistDto) {
    const created = await this.create(ownerId, dto);
    return this.toResponse(created);
  }

  async findOne(query: QueryWishlistDto) {
    const where = this.toWhere(query);
    const wishlist = await this.wishlistsRepository.findOne(where, {
      relations: { owner: true, items: true },
    });

    if (!wishlist) throw new NotFoundException('Wishlist not found');

    return wishlist;
  }

  async findOneResponse(id: number) {
    const wishlist = await this.findOneOrFail({ id });
    return this.toResponse(wishlist);
  }

  async findMany(query?: QueryWishlistDto) {
    const where = this.toWhere(query);
    return this.wishlistsRepository.find({
      where,
      relations: { owner: true, items: true },
    });
  }

  async findManyResponses(topic?: string) {
    const wishlists = await this.findMany(topic ? { name: topic } : undefined);
    return Promise.all(wishlists.map((wl) => this.toResponse(wl)));
  }

  async updateOne(
    query: QueryWishlistDto,
    dto: UpdateWishlistDto,
  ): Promise<WishlistEntity> {
    const entity = await this.findOneOrFail(query);
    if (dto.name !== undefined) entity.name = dto.name;
    if (dto.image !== undefined) entity.image = dto.image ?? null;
    if (dto.itemsId !== undefined) {
      entity.items = dto.itemsId.length
        ? await this.loadItems(dto.itemsId)
        : [];
    }
    await this.wishlistsRepository.save(entity);
    return this.findOneOrFail({ id: entity.id });
  }

  async removeOne(query: QueryWishlistDto) {
    const entity = await this.findOneOrFail(query);
    return this.wishlistsRepository.remove(entity);
  }

  async updateOwned(
    id: number,
    ownerId: number,
    dto: UpdateWishlistDto,
  ): Promise<WishlistEntity> {
    const entity = await this.findOneOrFail({ id });
    this.ensureOwned(entity, ownerId);
    return this.updateOne({ id }, dto);
  }

  async updateOwnedResponse(
    id: number,
    ownerId: number,
    dto: UpdateWishlistDto,
  ) {
    const updated = await this.updateOwned(id, ownerId, dto);
    return this.toResponse(updated);
  }

  async removeOwned(id: number, ownerId: number) {
    const entity = await this.findOneOrFail({ id });
    this.ensureOwned(entity, ownerId);
    await this.wishlistsRepository.remove(entity);
  }

  async removeOwnedResponse(id: number, ownerId: number) {
    const entity = await this.findOneOrFail({ id });
    this.ensureOwned(entity, ownerId);
    const response = await this.toResponse(entity);
    await this.wishlistsRepository.remove(entity);
    return response;
  }

  private toWhere(query?: QueryWishlistDto): FindOptionsWhere<WishlistEntity> {
    if (!query) return {};
    const where: FindOptionsWhere<WishlistEntity> = {};
    if (query.id !== undefined) where.id = query.id;
    if (query.name !== undefined) where.name = query.name;
    if (query.ownerId !== undefined)
      where.owner = { id: query.ownerId } as FindOptionsWhere<UserEntity>;
    return where;
  }

  private async findOneOrFail(query: QueryWishlistDto) {
    const entity = await this.findOne(query);
    if (!entity) throw new NotFoundException('Wishlist not found');
    return entity;
  }

  private ensureOwned(entity: WishlistEntity, ownerId: number) {
    if (entity.owner.id !== ownerId) {
      throw new ForbiddenException('You cannot modify this wishlist');
    }
  }

  private async loadItems(ids: number[]) {
    const items = await this.wishesRepository.findByIds(ids);
    if (items.length !== ids.length) {
      throw new NotFoundException('One or more wishes not found');
    }
    return items;
  }

  private async toResponse(
    wishlist: WishlistEntity,
  ): Promise<WishlistResponseDto> {
    const items = (
      await Promise.all(
        (wishlist.items ?? []).map(async (item) => {
          const detailed = await this.wishesService.getWithProgress({
            id: item.id,
          });
          if (!detailed) return null;
          return this.wishesService.toPartialResponse(detailed);
        }),
      )
    ).filter(Boolean) as WishSummaryResponseDto[];

    const payload = {
      ...wishlist,
      items,
    };

    return instantiateValidated(WishlistResponseDto, payload, {
      transformOptions: WishlistsService.TRANSFORM_OPTIONS,
    });
  }
}
