import { IsInt, IsOptional, IsString } from 'class-validator';

export class QueryWishlistDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  ownerId?: number;
}
