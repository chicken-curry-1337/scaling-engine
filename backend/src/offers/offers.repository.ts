import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { Offer, OfferStatus } from './entities/offer.entity';
import { WishEntity } from '../wishes/entities/wish.entity';

@Injectable()
export class OffersRepository {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(WishEntity)
    private readonly wishesRepository: Repository<WishEntity>,
  ) {}

  create(data: Partial<Offer>) {
    return this.offerRepository.create(data);
  }

  save(entity: Offer) {
    return this.offerRepository.save(entity);
  }

  findOne(
    where: FindOptionsWhere<Offer>,
    options?: Pick<FindManyOptions<Offer>, 'relations'>,
  ) {
    return this.offerRepository.findOne({ where, ...(options ?? {}) });
  }

  find(options?: FindManyOptions<Offer>) {
    return this.offerRepository.find(options);
  }

  remove(entity: Offer) {
    return this.offerRepository.remove(entity);
  }

  async getRaisedAmount(wishId: number) {
    const result = await this.offerRepository
      .createQueryBuilder('offer')
      .select('COALESCE(SUM(offer.amount), 0)', 'sum')
      .where('offer.wishId = :id', { id: wishId })
      .andWhere('offer.status IN (:...statuses)', {
        statuses: [OfferStatus.ACTIVE, OfferStatus.COMPLETED],
      })
      .getRawOne<{ sum: string }>();

    const sum = result?.sum ?? '0';
    return Number(sum);
  }

  findWishWithOwner(id: number) {
    return this.wishesRepository.findOne({
      where: { id },
      relations: { owner: true },
    });
  }
}
