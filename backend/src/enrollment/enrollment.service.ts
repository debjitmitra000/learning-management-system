import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Enrollment } from './schemas/enrollment.schema';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { CoursesService } from 'src/courses/courses.service';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectModel(Enrollment.name) private EnrollmentModel: Model<Enrollment>,
    private readonly coursesService: CoursesService,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto, studentId: string) {
    try {
      // Verify course exists and is published
      const course = await this.coursesService.findOne(createEnrollmentDto.course);
      
      if (course.status !== 'published') {
        throw new BadRequestException('Cannot enroll in unpublished course');
      }

      // Check if already enrolled
      const existingEnrollment = await this.EnrollmentModel.findOne({
        student: studentId,
        course: createEnrollmentDto.course,
      });

      if (existingEnrollment) {
        throw new ConflictException('Already enrolled in this course');
      }

      // Create enrollment
      const enrollment = await this.EnrollmentModel.create({
        student: studentId,
        course: createEnrollmentDto.course,
      });

      return enrollment;
    } catch (error) {
      throw error;
    }
  }

  async findByStudent(studentId: string) {
    try {
      return await this.EnrollmentModel.find({ student: studentId })
        .populate('course')
        .exec();
    } catch (error) {
      throw error;
    }
  }

  async findOne(studentId: string, courseId: string) {
    try {
      const enrollment = await this.EnrollmentModel.findOne({
        student: studentId,
        course: courseId,
      }).populate('course');

      if (!enrollment) {
        throw new NotFoundException('Enrollment not found');
      }

      return enrollment;
    } catch (error) {
      throw error;
    }
  }

  async isEnrolled(studentId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.EnrollmentModel.findOne({
      student: studentId,
      course: courseId,
    });
    return !!enrollment;
  }

  async updateProgress(
    studentId: string,
    courseId: string,
    updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    try {
      const enrollment = await this.EnrollmentModel.findOne({
        student: studentId,
        course: courseId,
      });

      if (!enrollment) {
        throw new NotFoundException('Enrollment not found');
      }

      const updated = await this.EnrollmentModel.findByIdAndUpdate(
        enrollment._id,
        updateEnrollmentDto,
        { new: true },
      );

      return updated;
    } catch (error) {
      throw error;
    }
  }

  async remove(studentId: string, courseId: string) {
    try {
      const enrollment = await this.EnrollmentModel.findOne({
        student: studentId,
        course: courseId,
      });

      if (!enrollment) {
        throw new NotFoundException('Enrollment not found');
      }

      await this.EnrollmentModel.findByIdAndDelete(enrollment._id);
      return { message: 'Enrollment deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
}