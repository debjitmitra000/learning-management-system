import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseDto } from './createCourse.dto';
import { Transform } from 'class-transformer';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
    title?: string;       
    description?: string;
    @Transform(({ value }) => parseFloat(value)) 
    price?: number;       
    status?: string; 
    bannerUrl?: string;
    bannerPublicId?: string;
}
