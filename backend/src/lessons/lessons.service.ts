import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLessonDto } from './dto/createLesson.dto';
import { UpdateLessonDto } from './dto/updateLesson.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Lesson } from './schemas/lesson.schema';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CoursesService } from 'src/courses/courses.service';
import { EnrollmentService } from 'src/enrollment/enrollment.service';
import { Model } from 'mongoose';
import { ResourceType } from './lessons.types';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Lesson.name) private LessonModel: Model<Lesson>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly coursesService: CoursesService,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  async create(
    createLessonDto: CreateLessonDto,
    instructorId: string,
    files?: Express.Multer.File[],
  ) {
    try {
      const course = await this.coursesService.findOne(createLessonDto.course);
      if (course.instructor.toString() !== instructorId) {
        throw new ForbiddenException(
          'You are not the instructor of this course',
        );
      }

      let order = createLessonDto.order;
      if (order === undefined || order === null) {
        const lastLesson = await this.LessonModel.findOne({ 
          course: createLessonDto.course 
        })
          .sort({ order: -1 })
          .exec();
        
        order = lastLesson ? lastLesson.order + 1 : 1;
      }

      const resources: Array<{
        url: string;
        publicId?: string;
        filename: string;
        type: string;
        size?: number;
        duration?: number;
      }> = [];

      if (files && Array.isArray(files) && files.length > 0) {
        for (const file of files) {
          if (!file || !file.mimetype || !file.originalname) continue;

          try {
            const resourceType = this.getResourceType(file.mimetype);
            const resource = await this.uploadResource(file, resourceType);
            resources.push(resource);
          } catch (error) {
            throw error;
          }
        }
      }

      if (createLessonDto.externalLinks && Array.isArray(createLessonDto.externalLinks)) {
        for (const link of createLessonDto.externalLinks) {
          if (!link || typeof link !== 'object') {
            continue;
          }
          if (!link.url || !link.filename) {
            continue;
          }
          if (typeof link.url !== 'string' || typeof link.filename !== 'string') {
            continue;
          }

          const trimmedUrl = link.url.trim();
          const trimmedFilename = link.filename.trim();

          if (!trimmedUrl || !trimmedFilename) {
            continue;
          }

          resources.push({
            url: trimmedUrl,
            filename: trimmedFilename,
            type: ResourceType.Link,
          });
        }
      }

      for (let i = 0; i < resources.length; i++) {
        if (!resources[i].url || !resources[i].filename || !resources[i].type) {
          throw new BadRequestException(`Resource at index ${i} is invalid`);
        }
      }

      const lessonData = {
        title: createLessonDto.title,
        description: createLessonDto.description,
        course: createLessonDto.course,
        order: order,
        isPublished: createLessonDto.isPublished ?? false,
        textContent: createLessonDto.textContent,
        resources: resources,
      };

      const lesson = await this.LessonModel.create(lessonData);
      return lesson;
    } catch (error) {
      throw error;
    }
  }

  // Public method - returns basic info without sensitive content
  async findByCoursePublic(courseId: string) {
    try {
      const lessons = await this.LessonModel.find({ course: courseId })
        .sort({ order: 1 })
        .select('title description order isPublished course')
        .exec();
      
      return lessons;
    } catch (error) {
      throw new BadRequestException('Invalid course ID');
    }
  }

  // Full access method for enrolled students
  async findByCourse(courseId: string) {
    try {
      return await this.LessonModel.find({ course: courseId })
        .sort({ order: 1 })
        .exec();
    } catch (error) {
      throw new BadRequestException('Invalid course ID');
    }
  }

  async findOne(id: string, studentId: string) {
    try {
      const lesson = await this.LessonModel.findById(id).populate('course');
      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }

      const course: any = lesson.course;
      
      // studentId is required - if not provided, user is not authenticated
      if (!studentId) {
        throw new ForbiddenException(
          'You must be logged in to view lesson details',
        );
      }
      
      // Check if user is the instructor
      const isInstructor = course.instructor.toString() === studentId;
      
      // Check if user is enrolled (only if not instructor)
      let isEnrolled = false;
      if (!isInstructor) {
        isEnrolled = await this.enrollmentService.isEnrolled(
          studentId,
          course._id.toString(),
        );
      }

      // If not instructor and not enrolled, deny access
      if (!isInstructor && !isEnrolled) {
        throw new ForbiddenException(
          'You must be enrolled in this course to view lesson details',
        );
      }

      return lesson;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Invalid lesson ID format');
    }
  }

  async findByInstructor(instructorId: string) {
    try {
      return await this.LessonModel.find()
        .populate({
          path: 'course',
          match: { instructor: instructorId },
        })
        .exec()
        .then((lessons) => lessons.filter((lesson) => lesson.course !== null));
    } catch (error) {
      throw error;
    }
  }

  async update(
    id: string,
    updateLessonDto: UpdateLessonDto,
    instructorId: string,
    files?: Express.Multer.File[],
  ) {
    try {
      const lesson = await this.LessonModel.findById(id).populate('course');
      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }

      const course: any = lesson.course;
      if (course.instructor.toString() !== instructorId) {
        throw new ForbiddenException(
          'You are not the instructor of this course',
        );
      }

      let resources = (lesson.resources || []).filter(
        (r) => r && r.url && r.filename && r.type,
      );

      if (updateLessonDto.removeResourceIds && updateLessonDto.removeResourceIds.length > 0) {
        const resourcesToDelete = resources.filter(
          (r) => r.publicId && updateLessonDto.removeResourceIds!.includes(r.publicId),
        );

        for (const resource of resourcesToDelete) {
          if (resource.publicId) {
            const resourceTypeMap: { [key: string]: 'image' | 'video' | 'raw' } = {
              video: 'video',
              image: 'image',
              pdf: 'raw',
              document: 'raw',
            };
            try {
              await this.cloudinaryService.deleteResource(
                resource.publicId,
                resourceTypeMap[resource.type] || 'raw',
              );
            } catch (error) {
              throw error;
            }
          }
        }

        resources = resources.filter(
          (r) => !r.publicId || !updateLessonDto.removeResourceIds!.includes(r.publicId),
        );
      }

      if (files && Array.isArray(files) && files.length > 0) {
        for (const file of files) {
          if (!file || !file.mimetype || !file.originalname) continue;

          try {
            const resourceType = this.getResourceType(file.mimetype);
            const resource = await this.uploadResource(file, resourceType);
            resources.push(resource);
          } catch (error) {
            throw error;
          }
        }
      }

      if (updateLessonDto.externalLinks && Array.isArray(updateLessonDto.externalLinks)) {
        for (const link of updateLessonDto.externalLinks) {
          if (!link || typeof link !== 'object') {
            continue;
          }

          if (!link.url || !link.filename) {
            continue;
          }

          if (typeof link.url !== 'string' || typeof link.filename !== 'string') {
            continue;
          }

          const trimmedUrl = link.url.trim();
          const trimmedFilename = link.filename.trim();

          if (!trimmedUrl || !trimmedFilename) {
            continue;
          }

          const exists = resources.some(
            (r) => r.type === ResourceType.Link && r.url === trimmedUrl,
          );

          if (!exists) {
            resources.push({
              url: trimmedUrl,
              filename: trimmedFilename,
              type: ResourceType.Link,
            });
          }
        }
      }

      for (let i = 0; i < resources.length; i++) {
        if (!resources[i].url || !resources[i].filename || !resources[i].type) {
          throw new BadRequestException(`Resource at index ${i} is invalid`);
        }
      }

      const updateData: any = { resources };

      if (updateLessonDto.title !== undefined) updateData.title = updateLessonDto.title;
      if (updateLessonDto.description !== undefined) updateData.description = updateLessonDto.description;
      if (updateLessonDto.order !== undefined) updateData.order = updateLessonDto.order;
      if (updateLessonDto.isPublished !== undefined) updateData.isPublished = updateLessonDto.isPublished;
      if (updateLessonDto.textContent !== undefined) updateData.textContent = updateLessonDto.textContent;

      const updatedLesson = await this.LessonModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true },
      );

      return updatedLesson;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to update lesson');
    }
  }

  async remove(id: string, instructorId: string) {
    try {
      const lesson = await this.LessonModel.findById(id).populate('course');
      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }

      const course: any = lesson.course;
      if (course.instructor.toString() !== instructorId) {
        throw new ForbiddenException(
          'You are not the instructor of this course',
        );
      }

      if (lesson.resources && lesson.resources.length > 0) {
        for (const resource of lesson.resources) {
          if (resource.publicId) {
            const resourceTypeMap: { [key: string]: 'image' | 'video' | 'raw' } = {
              video: 'video',
              image: 'image',
              pdf: 'raw',
              document: 'raw',
            };
            await this.cloudinaryService.deleteResource(
              resource.publicId,
              resourceTypeMap[resource.type],
            );
          }
        }
      }

      await this.LessonModel.findByIdAndDelete(id);
      return { message: 'Lesson deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Invalid lesson ID format');
    }
  }

  async removeResource(lessonId: string, publicId: string, instructorId: string) {
    try {
      const lesson = await this.LessonModel.findById(lessonId).populate('course');
      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }

      const course: any = lesson.course;
      if (course.instructor.toString() !== instructorId) {
        throw new ForbiddenException(
          'You are not the instructor of this course',
        );
      }

      const resource = lesson.resources?.find((r) => r.publicId === publicId);
      if (!resource) {
        throw new NotFoundException('Resource not found');
      }

      const resourceTypeMap: { [key: string]: 'image' | 'video' | 'raw' } = {
        video: 'video',
        image: 'image',
        pdf: 'raw',
        document: 'raw',
      };
      await this.cloudinaryService.deleteResource(
        publicId,
        resourceTypeMap[resource.type],
      );

      if (lesson.resources) {
        lesson.resources = lesson.resources.filter((r) => r.publicId !== publicId);
        await lesson.save();
      }

      return { message: 'Resource deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Invalid request');
    }
  }

  private getResourceType(mimetype: string): ResourceType {
    if (mimetype.startsWith('video/')) {
      return ResourceType.Video;
    } else if (mimetype.startsWith('image/')) {
      return ResourceType.Image;
    } else if (mimetype === 'application/pdf') {
      return ResourceType.PDF;
    } else {
      return ResourceType.Document;
    }
  }

  private async uploadResource(file: Express.Multer.File, type: ResourceType) {
    let uploadResult;

    switch (type) {
      case ResourceType.Video:
        uploadResult = await this.cloudinaryService.uploadVideo(file);
        return {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          filename: file.originalname,
          type: ResourceType.Video,
          size: file.size,
          duration: uploadResult.duration,
        };

      case ResourceType.Image:
        uploadResult = await this.cloudinaryService.uploadLessonImage(file);
        return {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          filename: file.originalname,
          type: ResourceType.Image,
          size: file.size,
        };

      case ResourceType.PDF:
      case ResourceType.Document:
        uploadResult = await this.cloudinaryService.uploadDocument(file);
        return {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          filename: file.originalname,
          type: type,
          size: file.size,
        };

      default:
        throw new BadRequestException('Unsupported file type');
    }
  }
}