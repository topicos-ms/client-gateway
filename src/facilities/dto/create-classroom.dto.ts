import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateClassroomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  building: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsBoolean()
  @IsOptional()
  available?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  resources?: string;
}
