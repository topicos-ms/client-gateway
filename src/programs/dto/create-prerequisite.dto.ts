import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class CreatePrerequisiteDto {
  @IsUUID()
  main_course_id!: string;

  @IsUUID()
  required_course_id!: string;

  @IsIn(['required', 'optional'])
  @IsOptional()
  kind?: string = 'required';
}
