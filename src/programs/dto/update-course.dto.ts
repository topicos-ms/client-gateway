import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseDto } from './create-course.dto';
import { IsUUID } from 'class-validator';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @IsUUID()
  id: string;
}
