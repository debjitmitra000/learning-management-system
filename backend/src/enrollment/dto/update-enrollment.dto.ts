import { PartialType } from '@nestjs/mapped-types';
import { CreateEnrollmentDto } from './create-enrollment.dto';
import { IsEnum, IsNumber, IsOptional, IsArray } from 'class-validator';

export class UpdateEnrollmentDto extends PartialType(CreateEnrollmentDto) {

  @IsNumber()
  @IsOptional()
  progress?: number;

  @IsEnum(['active', 'completed', 'dropped'])
  @IsOptional()
  status?: string;

  @IsArray()
  @IsOptional()
  completedLessons?: string[];
}