import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(64)
  username: string;

  @IsString()
  @MaxLength(255)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  about?: string;
}
