import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class ExternalLinkDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  filename: string; 
}