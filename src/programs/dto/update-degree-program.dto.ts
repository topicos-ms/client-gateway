import { PartialType } from '@nestjs/mapped-types';
import { CreateDegreeProgramDto } from './create-degree-program.dto';
import { IsUUID } from 'class-validator';

export class UpdateDegreeProgramDto extends PartialType(CreateDegreeProgramDto) {
  @IsUUID()
  id: string;
}
