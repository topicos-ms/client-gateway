import { PartialType } from '@nestjs/mapped-types';
import { CreateClassroomDto } from './create-classroom.dto';
import { IsUUID } from 'class-validator';

export class UpdateClassroomDto extends PartialType(CreateClassroomDto) {
  @IsUUID()
  id: string;
}
