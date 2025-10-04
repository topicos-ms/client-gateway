import { PartialType } from '@nestjs/mapped-types';
import { CreateAcademicYearDto } from './create-academic-year.dto';
import { IsUUID } from 'class-validator';

export class UpdateAcademicYearDto extends PartialType(CreateAcademicYearDto) {
  @IsUUID()
  id: string;
}
