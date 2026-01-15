import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { Lesson, LessonSchema } from './schemas/lesson.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CoursesModule } from 'src/courses/courses.module';
import { EnrollmentModule } from 'src/enrollment/enrollment.module';

@Module({
  imports: [
      MongooseModule.forFeature([{ name: Lesson.name, schema: LessonSchema }]),
      CloudinaryModule,
      CoursesModule,
      EnrollmentModule
    ],
  controllers: [LessonsController],
  providers: [LessonsService],
})
export class LessonsModule {}