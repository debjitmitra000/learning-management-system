import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LessonDocument = HydratedDocument<Lesson>;

@Schema({timestamps: true})
export class Lesson {
  @Prop({required: true})
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  course: Types.ObjectId;

  @Prop({required: true})
  order: number;

  @Prop({default: false})
  isPublished: boolean;

  @Prop()
  textContent?: string;

  @Prop({ 
    type: [{
      url: { type: String, required: true },
      publicId: String, 
      filename: { type: String, required: true },
      type: { type: String, required: true }, 
      size: Number, 
      duration: Number, 
    }],
    default: []
  })
  resources?: Array<{
    url: string;
    publicId?: string;
    filename: string;
    type: string;
    size?: number;
    duration?: number;
  }>;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);

LessonSchema.index({ course: 1, order: 1 });