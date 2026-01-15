
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Status } from '../courses.types';

export type CourseDocument = HydratedDocument<Course>;

@Schema({ timestamps: true })
export class Course {
  @Prop({required: true})
  title: string;

  @Prop({required: true})
  description: string;

  @Prop({type: Types.ObjectId, ref: 'User', required: true})
  instructor: Types.ObjectId;

  @Prop({default: 0})
  price: number;

  @Prop({default: Status.Draft})
  status: string;

  @Prop()
  bannerUrl?: string;

  @Prop()
  bannerPublicId?: string;
}

export const CourseSchema = SchemaFactory.createForClass(Course);