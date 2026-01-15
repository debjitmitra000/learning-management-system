import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('enrollments')
@UseGuards(AuthGuard)
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  async enroll(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @Request() req,
  ) {
    return await this.enrollmentService.create(createEnrollmentDto, req.user.sub);
  }

  @Get('my-courses')
  async getMyEnrollments(@Request() req) {
    return await this.enrollmentService.findByStudent(req.user.sub);
  }

  @Get('check/:courseId')
  async checkEnrollment(@Param('courseId') courseId: string, @Request() req) {
    const isEnrolled = await this.enrollmentService.isEnrolled(
      req.user.sub,
      courseId,
    );
    return { enrolled: isEnrolled };
  }

  @Get(':courseId')
  async getEnrollmentDetails(
    @Param('courseId') courseId: string,
    @Request() req,
  ) {
    return await this.enrollmentService.findOne(req.user.sub, courseId);
  }

  @Patch(':courseId')
  async updateProgress(
    @Param('courseId') courseId: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
    @Request() req,
  ) {
    return await this.enrollmentService.updateProgress(
      req.user.sub,
      courseId,
      updateEnrollmentDto,
    );
  }

  @Delete(':courseId')
  async unenroll(@Param('courseId') courseId: string, @Request() req) {
    return await this.enrollmentService.remove(req.user.sub, courseId);
  }
}
