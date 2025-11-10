import { IsBoolean, IsOptional, IsPositive } from 'class-validator';

export class CreateWishOfferDto {
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;
}
