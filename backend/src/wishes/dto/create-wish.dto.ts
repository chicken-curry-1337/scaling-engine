import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateWishDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsUrl()
  link?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  description?: string;
}
