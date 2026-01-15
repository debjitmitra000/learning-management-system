import { Transform } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCourseDto{
    @IsString() @IsNotEmpty()
    title: string;

    @IsString() @IsNotEmpty()
    description: string;

    @IsOptional()
    @Transform(({ value }) => parseFloat(value)) 
    price?: number;

    bannerUrl?: string;
    bannerPublicId?: string;
}
