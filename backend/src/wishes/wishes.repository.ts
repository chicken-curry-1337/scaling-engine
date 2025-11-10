import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, In, Repository } from 'typeorm';
import { WishEntity } from './entities/wish.entity';

@Injectable()
export class WishesRepository {
  constructor(
    @InjectRepository(WishEntity)
    private readonly repository: Repository<WishEntity>,
  ) {}

  create(data: Partial<WishEntity>) {
    return this.repository.create(data);
  }

  save(entity: WishEntity) {
    return this.repository.save(entity);
  }

  findOne(
    where: FindOptionsWhere<WishEntity>,
    options?: Pick<FindManyOptions<WishEntity>, 'relations'>,
  ) {
    return this.repository.findOne({ where, ...(options ?? {}) });
  }

  find(options?: FindManyOptions<WishEntity>) {
    return this.repository.find(options);
  }

  remove(entity: WishEntity) {
    return this.repository.remove(entity);
  }

  findByIds(ids: number[]) {
    if (!ids.length) return Promise.resolve([] as WishEntity[]);
    return this.repository.find({ where: { id: In(ids) } });
  }
}
