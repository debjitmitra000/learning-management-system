import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/createCourse.dto';
import { UpdateCourseDto } from './dto/updateCourse.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Role } from 'src/user/user.types';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @UseGuards(AuthGuard,RolesGuard)
  @Roles(Role.Admin)
  @Post('create')
  @UseInterceptors(FileInterceptor('banner'))
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @Request() req,
    @UploadedFile() file: Express.Multer.File) {
    return await this.coursesService.create(createCourseDto, req.user.sub, file);
  }

  @Get('published')
  async findAll() {
    return await this.coursesService.findAllPublished();
  }

  @UseGuards(AuthGuard,RolesGuard)
  @Roles(Role.Admin)
  @Get('my-courses')
  async getMyCourses(@Request() req) {
    return await this.coursesService.findByInstructor(req.user.sub);
  }
  
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.coursesService.findOne(id);
  }

  @UseGuards(AuthGuard,RolesGuard)
  @Roles(Role.Admin)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('banner'))
  async update(
    @Param('id') id: string, 
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req) {
    return await this.coursesService.update(id, updateCourseDto, req.user.sub, file);
  }

  @UseGuards(AuthGuard,RolesGuard)
  @Roles(Role.Admin)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return await this.coursesService.remove(id, req.user.sub);
  }
}
