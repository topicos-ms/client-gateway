import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateCourseSectionDto {
  @IsUUID()
  @IsOptional()
  course_id?: string;

  @IsUUID()
  @IsOptional()
  term_id?: string;

  @IsUUID()
  classroom_id!: string;

  @IsUUID()
  teacher_id!: string;

  @IsString()
  @IsOptional()
  degree_program_code?: string;

  @IsString()
  @IsOptional()
  study_plan_version?: string;

  @IsString()
  @IsOptional()
  course_code?: string;

  @IsString()
  @IsOptional()
  term_name?: string;

  @IsString()
  @IsOptional()
  teacher_email?: string;

  @IsString()
  @MaxLength(10)
  group_label!: string;

  @IsString()
  @MaxLength(20)
  modality!: string;

  @IsString()
  @MaxLength(20)
  shift!: string;

  @IsInt()
  @Min(1)
  quota_max!: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  quota_available?: number;

  @IsString()
  @IsOptional()
  status?: string;
}
