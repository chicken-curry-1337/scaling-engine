import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsWhere, QueryFailedError } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { QueryUserDto } from './dto/query-user.dto';
import {
  UserPublicResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { instantiateValidated } from '../common/dto/validation.util';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private static readonly USER_TRANSFORM_OPTIONS = {
    enableImplicitConversion: true,
    excludeExtraneousValues: true,
  } as const;

  constructor(private readonly usersRepository: UsersRepository) {}

  async create(partial: Partial<UserEntity>) {
    const entity = this.usersRepository.create(partial);
    try {
      return await this.usersRepository.save(entity);
    } catch (error) {
      this.rethrowIfUniqueViolation(error);
      throw error;
    }
  }

  async findOne(query: QueryUserDto) {
    return this.usersRepository.findOne(this.toWhere(query));
  }

  async findMany(query?: QueryUserDto) {
    return this.usersRepository.find({ where: this.toWhere(query) });
  }

  async findManyByQuery(search: string) {
    const pattern = this.toSearchPattern(search);
    if (!pattern) return [];

    return this.usersRepository.findBySearchPattern(pattern);
  }

  async getOwnProfileResponse(userId: number) {
    const user = await this.findOneOrFail({ id: userId });
    return this.toResponse(user);
  }

  async updateOwnProfileResponse(userId: number, dto: Partial<UserEntity>) {
    const updated = await this.updateOne({ id: userId }, dto);
    return this.toResponse(updated);
  }

  async findPublicProfilesResponse(query: string) {
    const users = await this.findManyByQuery(query);
    return users.map((user) => this.toPublicResponse(user));
  }

  async getPublicProfileResponse(username: string) {
    const user = await this.findOneOrFail({ username });
    return this.toPublicResponse(user);
  }

  async updateOne(query: QueryUserDto, dto: Partial<UserEntity>) {
    const entity = await this.findOneOrFail(query);
    Object.assign(entity, dto);
    try {
      return await this.usersRepository.save(entity);
    } catch (error) {
      this.rethrowIfUniqueViolation(error);
      throw error;
    }
  }

  async removeOne(query: QueryUserDto) {
    const entity = await this.findOneOrFail(query);
    await this.usersRepository.remove(entity);
  }

  async findPasswordHashById(id: number): Promise<string | null> {
    return this.usersRepository.findPasswordHashById(id);
  }

  private toWhere(query?: QueryUserDto): FindOptionsWhere<UserEntity> {
    if (!query) return {};
    const where: FindOptionsWhere<UserEntity> = {};
    if (query.id !== undefined) where.id = query.id;
    if (query.username !== undefined) where.username = query.username;
    if (query.email !== undefined) where.email = query.email;
    return where;
  }

  async findOneOrFail(query: QueryUserDto) {
    const entity = await this.findOne(query);
    if (!entity) throw new NotFoundException('User not found');
    return entity;
  }

  private toResponse(user: UserEntity) {
    return instantiateValidated(UserResponseDto, user, {
      transformOptions: UsersService.USER_TRANSFORM_OPTIONS,
    });
  }

  private toPublicResponse(user: UserEntity) {
    return instantiateValidated(UserPublicResponseDto, user, {
      transformOptions: UsersService.USER_TRANSFORM_OPTIONS,
    });
  }

  private rethrowIfUniqueViolation(error: unknown) {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string } | undefined;
      if (driverError?.code === '23505') {
        throw new ConflictException('Email or username already in use');
      }
    }
  }

  private toSearchPattern(raw: string) {
    const trimmed = raw?.trim();
    if (!trimmed) return null;
    const escaped = trimmed.replace(/[%_]/g, (match) => `\\${match}`);
    return `%${escaped}%`;
  }
}
