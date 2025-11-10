import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { WishEntity } from '../entities/wish.entity';
import { Offer, OfferStatus } from '../../offers/entities/offer.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { UserPublicResponseDto } from '../../users/dto/user-response.dto';

export type WishWithRelations = WishEntity & {
  owner?: UserEntity | null;
  offers?: Array<Offer & { user?: UserEntity | null }>;
  raised?: number;
};

export class WishSummaryResponseDto {
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

export class WishOfferResponseDto {
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
}

export class WishResponseDto extends WishSummaryResponseDto {
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WishOfferResponseDto)
  offers: WishOfferResponseDto[];
}
