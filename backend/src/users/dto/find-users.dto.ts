import { IsNotEmpty, IsString } from 'class-validator';

export class FindUsersDto {
  @IsString()
  @IsNotEmpty()
  query: string;
}
