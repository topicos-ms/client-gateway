import { IsInt, IsString, MaxLength, Min } from 'class-validator';

export class CreateLevelDto {
  @IsString()
  @MaxLength(50)
  name!: string;

  @IsInt()
  @Min(1)
  order!: number;
}
