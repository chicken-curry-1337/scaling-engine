import { Expose, Type } from 'class-transformer';
import { IsDate, IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class UserPublicResponseDto {
  @Expose()
  @IsInt()
  id: number;

  @Expose()
  @IsString()
  username: string;

  @Expose()
  @IsOptional()
  @IsString()
  about?: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @Expose()
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}

export class UserResponseDto extends UserPublicResponseDto {
  @Expose()
  @IsEmail()
  email: string;
}
