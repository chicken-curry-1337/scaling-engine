import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { WishlistEntity } from '../entities/wishlist.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { UserPublicResponseDto } from '../../users/dto/user-response.dto';
import { WishSummaryResponseDto } from '../../wishes/dto/wish-response.dto';

export type WishlistWithRelations = WishlistEntity & {
  owner?: UserEntity | null;
};

export class WishlistResponseDto {
  @Expose()
  @IsInt()
  id: number;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsOptional()
  @IsString()
  image?: string | null;

  @Expose()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => UserPublicResponseDto)
  owner?: UserPublicResponseDto | null;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WishSummaryResponseDto)
  items: WishSummaryResponseDto[];
}
