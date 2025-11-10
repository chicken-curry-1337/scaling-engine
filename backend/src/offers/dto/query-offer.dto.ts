import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { OfferStatus } from '../entities/offer.entity';

export class QueryOfferDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  wishId?: number;

  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;
}
