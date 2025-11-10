import { IsBoolean, IsInt, IsOptional, IsPositive } from 'class-validator';

export class CreateOfferRequestDto {
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;

  @IsInt()
  @IsPositive()
  itemId: number;
}
