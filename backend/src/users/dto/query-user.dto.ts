import { IsEmail, IsInt, IsOptional, IsString } from 'class-validator';

export class QueryUserDto {
  @IsOptional() @IsInt() id?: number;
  @IsOptional() @IsString() username?: string;
  @IsOptional() @IsEmail() email?: string;
}
