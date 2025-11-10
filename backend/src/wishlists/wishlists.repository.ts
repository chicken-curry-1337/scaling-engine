import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { WishlistEntity } from './entities/wishlist.entity';

@Injectable()
export class WishlistsRepository {
  constructor(
    @InjectRepository(WishlistEntity)
    private readonly repository: Repository<WishlistEntity>,
  ) {}

  create(data: Partial<WishlistEntity>) {
    return this.repository.create(data);
  }

  save(entity: WishlistEntity) {
    return this.repository.save(entity);
  }

  findOne(
    where: FindOptionsWhere<WishlistEntity>,
    options?: Pick<FindManyOptions<WishlistEntity>, 'relations'>,
  ) {
    return this.repository.findOne({ where, ...(options ?? {}) });
  }

  find(options?: FindManyOptions<WishlistEntity>) {
    return this.repository.find(options);
  }

  remove(entity: WishlistEntity) {
    return this.repository.remove(entity);
  }
}
