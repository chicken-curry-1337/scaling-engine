import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  about?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password?: string;
}
