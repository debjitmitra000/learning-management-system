
import { PartialType } from '@nestjs/mapped-types';
import { CreateLessonDto } from './createLesson.dto';
import { IsArray, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateLessonDto extends PartialType(CreateLessonDto) {
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    
    if (Array.isArray(value)) return value;
    
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value.trim());
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    }
    
    return undefined;
  })
  removeResourceIds?: string[];
}
