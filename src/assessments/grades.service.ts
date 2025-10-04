import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from '../config';
import { CreateGradeDto, ListGradesDto, UpdateGradeDto } from './dto';

@Injectable()
export class GradesService {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  create(createGradeDto: CreateGradeDto) {
    return firstValueFrom(this.client.send('grades.create', createGradeDto));
  }

  findAll(listGradesDto: ListGradesDto) {
    return firstValueFrom(this.client.send('grades.list', listGradesDto));
  }

  findOne(id: string) {
    return firstValueFrom(this.client.send('grades.findOne', id));
  }

  update(id: string, updateGradeDto: UpdateGradeDto) {
    return firstValueFrom(
      this.client.send('grades.update', {
        id,
        updateGradeDto,
      }),
    );
  }

  remove(id: string) {
    return firstValueFrom(this.client.send('grades.remove', id));
  }
}
