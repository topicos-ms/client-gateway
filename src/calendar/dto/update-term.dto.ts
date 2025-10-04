import { PartialType } from '@nestjs/mapped-types';
import { CreateTermDto } from './create-term.dto';
import { IsUUID } from 'class-validator';

export class UpdateTermDto extends PartialType(CreateTermDto) {
  @IsUUID()
  id: string;
}
