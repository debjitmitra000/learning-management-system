import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { ExternalLinkDto } from "./ExternalLink.dto";

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  course: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseInt(value);
    return isNaN(parsed) ? undefined : parsed;
  })
  order?: number;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublished?: boolean;

  @IsString()
  @IsOptional()
  textContent?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExternalLinkDto)
  @Transform(({ value }) => {
    
    if (!value) {
      return [];
    }
    
    if (typeof value === 'string') {
      if (value.trim() === '' || value.trim() === '[]') {
        return [];
      }
      
      try {
        const parsed = JSON.parse(value);
        
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(item => 
            item && 
            typeof item === 'object' && 
            item.url && 
            item.filename &&
            typeof item.url === 'string' &&
            typeof item.filename === 'string' &&
            item.url.trim() !== '' &&
            item.filename.trim() !== ''
          );
          return filtered;
        }
      } catch (error) {
        return [];
      }
    }

    if (Array.isArray(value)) {
      const filtered = value.filter(item => 
        item && 
        typeof item === 'object' && 
        item.url && 
        item.filename &&
        typeof item.url === 'string' &&
        typeof item.filename === 'string' &&
        item.url.trim() !== '' &&
        item.filename.trim() !== ''
      );
      return filtered;
    }
    
    return [];
  }, { toClassOnly: true }) 
  externalLinks?: ExternalLinkDto[];
}