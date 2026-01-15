import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  UseInterceptors, 
  Request, 
  UploadedFiles 
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/createLesson.dto';
import { UpdateLessonDto } from './dto/updateLesson.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/courses/roles.guard';
import { Roles } from 'src/courses/roles.decorator';
import { Role } from 'src/user/user.types';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ParseJsonPipe } from './pipes/parse-json.pipe';


@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post('create')
  @UseInterceptors(FilesInterceptor('files', 10))
  async create(
    @Body(new ParseJsonPipe('externalLinks')) createLessonDto: CreateLessonDto,
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.lessonsService.create(
      createLessonDto,
      req.user.sub,
      files
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('instructor/my-lessons')
  async getMyLessons(@Request() req) {
    return await this.lessonsService.findByInstructor(req.user.sub);
  }

  // Public endpoint - shows basic lesson info for course listing
  @Get('course/:courseId')
  async getCourseLessons(@Param('courseId') courseId: string) {
    return await this.lessonsService.findByCoursePublic(courseId);
  }

  // Protected endpoint - shows full lesson details only if enrolled or instructor
  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return await this.lessonsService.findOne(id, req.user.sub);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files', 10))
  async update(
    @Param('id') id: string,
    @Body(new ParseJsonPipe('externalLinks'), new ParseJsonPipe('removeResourceIds')) updateLessonDto: UpdateLessonDto,
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.lessonsService.update(
      id,
      updateLessonDto,
      req.user.sub,
      files,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return await this.lessonsService.remove(id, req.user.sub);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Delete(':lessonId/resources/:publicId')
  async removeResource(
    @Param('lessonId') lessonId: string,
    @Param('publicId') publicId: string,
    @Request() req,
  ) {
    return await this.lessonsService.removeResource(lessonId, publicId, req.user.sub);
  }
}