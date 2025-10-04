import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from '../../config';
import {
  CreateClassroomDto,
  UpdateClassroomDto,
  ListClassroomsDto,
} from '../dto';

@Injectable()
export class FacilitiesService {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  createClassroom(createClassroomDto: CreateClassroomDto) {
    return firstValueFrom(
      this.client.send('facilities.classrooms.create', createClassroomDto),
    );
  }

  findClassrooms(listClassroomsDto: ListClassroomsDto) {
    return firstValueFrom(
      this.client.send('facilities.classrooms.list', listClassroomsDto),
    );
  }

  findClassroomById(id: string) {
    return firstValueFrom(
      this.client.send('facilities.classrooms.findOne', id),
    );
  }

  updateClassroom(id: string, updateClassroomDto: UpdateClassroomDto) {
    return firstValueFrom(
      this.client.send('facilities.classrooms.update', {
        id,
        updateClassroomDto,
      }),
    );
  }

  removeClassroom(id: string) {
    return firstValueFrom(
      this.client.send('facilities.classrooms.remove', id),
    );
  }
}
