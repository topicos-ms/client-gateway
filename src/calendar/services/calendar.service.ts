import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from '../../config';
import {
  CreateAcademicYearDto,
  ListAcademicYearDto,
  UpdateAcademicYearDto,
  CreateTermDto,
  UpdateTermDto,
  ListTermDto,
} from '../dto';

@Injectable()
export class CalendarService {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  // Academic Years
  createAcademicYear(createAcademicYearDto: CreateAcademicYearDto) {
    return firstValueFrom(
      this.client.send('calendar.academicYears.create', createAcademicYearDto),
    );
  }

  findAcademicYears(listAcademicYearDto: ListAcademicYearDto) {
    return firstValueFrom(
      this.client.send('calendar.academicYears.list', listAcademicYearDto),
    );
  }

  findOneAcademicYear(id: string) {
    return firstValueFrom(
      this.client.send('calendar.academicYears.findOne', id),
    );
  }

  updateAcademicYear(id: string, updateAcademicYearDto: UpdateAcademicYearDto) {
    return firstValueFrom(
      this.client.send('calendar.academicYears.update', {
        id,
        updateAcademicYearDto,
      }),
    );
  }

  removeAcademicYear(id: string) {
    return firstValueFrom(
      this.client.send('calendar.academicYears.remove', id),
    );
  }

  // Terms
  createTerm(createTermDto: CreateTermDto) {
    return firstValueFrom(this.client.send('calendar.terms.create', createTermDto));
  }

  findTerms(listTermDto: ListTermDto) {
    return firstValueFrom(this.client.send('calendar.terms.list', listTermDto));
  }

  findOneTerm(id: string) {
    return firstValueFrom(this.client.send('calendar.terms.findOne', id));
  }

  updateTerm(id: string, updateTermDto: UpdateTermDto) {
    return firstValueFrom(
      this.client.send('calendar.terms.update', {
        id,
        updateTermDto,
      }),
    );
  }

  removeTerm(id: string) {
    return firstValueFrom(this.client.send('calendar.terms.remove', id));
  }
}
