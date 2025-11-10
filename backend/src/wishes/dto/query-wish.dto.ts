import { IsInt, IsOptional, IsString } from 'class-validator';

export class QueryWishDto {
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
