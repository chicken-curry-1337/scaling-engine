import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  create(data: Partial<UserEntity>) {
    return this.repository.create(data);
  }

  save(entity: UserEntity) {
    return this.repository.save(entity);
  }

  findOne(where: FindOptionsWhere<UserEntity>) {
    return this.repository.findOne({ where });
  }

  find(options?: FindManyOptions<UserEntity>) {
    return this.repository.find(options);
  }

  findBySearchPattern(pattern: string) {
    return this.repository.find({
      where: [{ username: ILike(pattern) }, { email: ILike(pattern) }],
    });
  }

  remove(entity: UserEntity) {
    return this.repository.remove(entity);
  }

  async findPasswordHashById(id: number) {
    const row = await this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();
    return row?.passwordHash ?? null;
  }
}
