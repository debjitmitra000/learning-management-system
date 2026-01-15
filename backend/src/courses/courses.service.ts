import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/createCourse.dto';
import { UpdateCourseDto } from './dto/updateCourse.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Course } from './schemas/course.schema';
import { Model } from 'mongoose';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private CourseModel: Model<Course>,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async create(createCourseDto: CreateCourseDto, adminId: string, file?: Express.Multer.File) {
    try {
      let bannerUrl: string | undefined;
      let bannerPublicId: string | undefined;

      if (file) {
        const uploadResult = await this.cloudinaryService.uploadImage(file);
        bannerUrl = uploadResult.secure_url;
        bannerPublicId = uploadResult.public_id;
      }

      return await this.CourseModel.create({
        title: createCourseDto.title,
        description: createCourseDto.description,
        instructor: adminId,
        price: createCourseDto.price,
        bannerUrl: bannerUrl,
        bannerPublicId: bannerPublicId,
      });
    } catch (error) {
      throw error;
    }
  }

  async findAllPublished() {
    try {
      return await this.CourseModel.find({ status: 'published' }).exec();
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const course = await this.CourseModel.findById(id);
      if (!course) {
        throw new NotFoundException('Course not found');
      }
      return course;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Invalid course ID format');
    }
  }

  async findByInstructor(instructorId: string) {
    try {
      return await this.CourseModel.find({ instructor: instructorId });
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, adminId: string, file?: Express.Multer.File) {
    try {
      const course = await this.CourseModel.findById(id);

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      if (course.instructor.toString() !== adminId) {
        throw new ForbiddenException(
          'You are not the instructor of this course',
        );
      }

      let bannerUrl = updateCourseDto.bannerUrl;
      let bannerPublicId = updateCourseDto.bannerPublicId;

      if (file) {
        if (course.bannerPublicId) {
          await this.cloudinaryService.deleteImage(course.bannerPublicId);
        }

        const uploadResult = await this.cloudinaryService.uploadImage(file);
        bannerUrl = uploadResult.secure_url;
        bannerPublicId = uploadResult.public_id;
      }

      const updatedCourse = await this.CourseModel.findByIdAndUpdate(
        id,
        { ...updateCourseDto, bannerUrl, bannerPublicId},
        { new: true },
      );

      return updatedCourse;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Invalid course ID format');
    }
  }

  async remove(id: string, adminId: string) {
    try {
      const course = await this.CourseModel.findById(id);

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      if (course.instructor.toString() !== adminId) {
        throw new ForbiddenException(
          'You are not the instructor of this course',
        );
      }

      if (course.bannerPublicId) {
        await this.cloudinaryService.deleteImage(course.bannerPublicId);
      }

      await this.CourseModel.findByIdAndDelete(id);

      return { message: 'Course deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Invalid course ID format');
    }
  }
}
