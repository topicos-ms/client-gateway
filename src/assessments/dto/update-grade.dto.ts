import { PartialType } from '@nestjs/mapped-types';
import { CreateGradeDto } from './create-grade.dto';
import { IsUUID } from 'class-validator';

export class UpdateGradeDto extends PartialType(CreateGradeDto) {
  @IsUUID()
  id: string;
}
