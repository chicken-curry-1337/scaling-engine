import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Offer, OfferStatus } from '../entities/offer.entity';
import { WishEntity } from '../../wishes/entities/wish.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { UserPublicResponseDto } from '../../users/dto/user-response.dto';

export type OfferWithRelations = Offer & {
  wish?: (WishEntity & { owner?: UserEntity | null; raised?: number }) | null;
  user?: UserEntity | null;
};

class OfferItemDto {
  @Expose()
  @IsInt()
  id: number;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsOptional()
  @IsString()
  link?: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  image?: string | null;

  @Expose()
  @IsNumber()
  price: number;

  @Expose()
  @IsInt()
  copied: number;

  @Expose()
  @IsOptional()
  @IsString()
  description?: string | null;

  @Expose()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;

  @Expose()
  @IsNumber()
  raised: number;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => UserPublicResponseDto)
  owner?: UserPublicResponseDto | null;
}

export class OfferResponseDto {
  @Expose()
  @IsInt()
  id: number;

  @Expose()
  @IsNumber()
  amount: number;

  @Expose()
  @IsBoolean()
  hidden: boolean;

  @Expose()
  @IsEnum(OfferStatus)
  status: OfferStatus;

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
  user?: UserPublicResponseDto | null;

  @Expose({ name: 'wish' })
  @IsOptional()
  @ValidateNested()
  @Type(() => OfferItemDto)
  item?: OfferItemDto | null;
}
