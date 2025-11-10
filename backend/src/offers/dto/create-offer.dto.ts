import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { OfferStatus } from '../entities/offer.entity';

export class CreateOfferDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @IsOptional()
  @IsInt()
  @IsPositive()
  userId?: number;

  @IsInt()
  @IsPositive()
  wishId: number;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;
}
