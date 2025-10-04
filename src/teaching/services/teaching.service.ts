import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from '../../config';
import {
  CreateCourseSectionDto,
  UpdateCourseSectionDto,
  ListCourseSectionsDto,
  CreateScheduleDto,
  UpdateScheduleDto,
  ListSchedulesDto,
} from '../dto';

@Injectable()
export class TeachingService {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  createCourseSection(createCourseSectionDto: CreateCourseSectionDto) {
    return firstValueFrom(
      this.client.send('teaching.courseSections.create', createCourseSectionDto),
    );
  }

  listCourseSections(listCourseSectionsDto: ListCourseSectionsDto) {
    return firstValueFrom(
      this.client.send('teaching.courseSections.list', listCourseSectionsDto),
    );
  }

  findCourseSection(id: string) {
    return firstValueFrom(this.client.send('teaching.courseSections.findOne', id));
  }

  updateCourseSection(id: string, updateCourseSectionDto: UpdateCourseSectionDto) {
    return firstValueFrom(
      this.client.send('teaching.courseSections.update', {
        id,
        updateCourseSectionDto,
      }),
    );
  }

  removeCourseSection(id: string) {
    return firstValueFrom(this.client.send('teaching.courseSections.remove', id));
  }

  createSchedule(createScheduleDto: CreateScheduleDto) {
    return firstValueFrom(
      this.client.send('teaching.schedules.create', createScheduleDto),
    );
  }

  listSchedules(listSchedulesDto: ListSchedulesDto) {
    return firstValueFrom(
      this.client.send('teaching.schedules.list', listSchedulesDto),
    );
  }

  findSchedule(id: string) {
    return firstValueFrom(this.client.send('teaching.schedules.findOne', id));
  }

  updateSchedule(id: string, updateScheduleDto: UpdateScheduleDto) {
    return firstValueFrom(
      this.client.send('teaching.schedules.update', {
        id,
        updateScheduleDto,
      }),
    );
  }

  removeSchedule(id: string) {
    return firstValueFrom(this.client.send('teaching.schedules.remove', id));
  }
}
