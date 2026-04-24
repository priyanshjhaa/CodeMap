import { IsEmail, IsString, IsOptional } from 'class-validator';

export class GithubCallbackDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsString()
  image!: string;

  @IsString()
  access_token!: string;

  @IsString()
  @IsOptional()
  refresh_token?: string;

  @IsOptional()
  expires_at?: number;
}
