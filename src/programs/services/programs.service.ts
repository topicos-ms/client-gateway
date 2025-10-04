import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from '../../config';
import {
  CreateDegreeProgramDto,
  UpdateDegreeProgramDto,
  ListDegreeProgramsDto,
  CreateStudyPlanDto,
  UpdateStudyPlanDto,
  ListStudyPlansDto,
  CreateLevelDto,
  UpdateLevelDto,
  ListLevelsDto,
  CreateCourseDto,
  UpdateCourseDto,
  ListCoursesDto,
  CreatePrerequisiteDto,
  UpdatePrerequisiteDto,
  ListPrerequisitesDto,
} from '../dto';

@Injectable()
export class ProgramsService {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  // Degree Programs
  createDegreeProgram(createDegreeProgramDto: CreateDegreeProgramDto) {
    return firstValueFrom(
      this.client.send('programs.degreePrograms.create', createDegreeProgramDto),
    );
  }

  listDegreePrograms(listDegreeProgramsDto: ListDegreeProgramsDto) {
    return firstValueFrom(
      this.client.send('programs.degreePrograms.list', listDegreeProgramsDto),
    );
  }

  findDegreeProgram(id: string) {
    return firstValueFrom(this.client.send('programs.degreePrograms.findOne', id));
  }

  updateDegreeProgram(id: string, updateDegreeProgramDto: UpdateDegreeProgramDto) {
    return firstValueFrom(
      this.client.send('programs.degreePrograms.update', {
        id,
        updateDegreeProgramDto,
      }),
    );
  }

  removeDegreeProgram(id: string) {
    return firstValueFrom(this.client.send('programs.degreePrograms.remove', id));
  }

  // Study plans
  createStudyPlan(createStudyPlanDto: CreateStudyPlanDto) {
    return firstValueFrom(
      this.client.send('programs.studyPlans.create', createStudyPlanDto),
    );
  }

  listStudyPlans(listStudyPlansDto: ListStudyPlansDto) {
    return firstValueFrom(
      this.client.send('programs.studyPlans.list', listStudyPlansDto),
    );
  }

  findStudyPlan(id: string) {
    return firstValueFrom(this.client.send('programs.studyPlans.findOne', id));
  }

  updateStudyPlan(id: string, updateStudyPlanDto: UpdateStudyPlanDto) {
    return firstValueFrom(
      this.client.send('programs.studyPlans.update', {
        id,
        updateStudyPlanDto,
      }),
    );
  }

  removeStudyPlan(id: string) {
    return firstValueFrom(this.client.send('programs.studyPlans.remove', id));
  }

  // Levels
  createLevel(createLevelDto: CreateLevelDto) {
    return firstValueFrom(this.client.send('programs.levels.create', createLevelDto));
  }

  listLevels(listLevelsDto: ListLevelsDto) {
    return firstValueFrom(this.client.send('programs.levels.list', listLevelsDto));
  }

  findLevel(id: string) {
    return firstValueFrom(this.client.send('programs.levels.findOne', id));
  }

  updateLevel(id: string, updateLevelDto: UpdateLevelDto) {
    return firstValueFrom(
      this.client.send('programs.levels.update', {
        id,
        updateLevelDto,
      }),
    );
  }

  removeLevel(id: string) {
    return firstValueFrom(this.client.send('programs.levels.remove', id));
  }

  // Courses
  createCourse(createCourseDto: CreateCourseDto) {
    return firstValueFrom(this.client.send('programs.courses.create', createCourseDto));
  }

  listCourses(listCoursesDto: ListCoursesDto) {
    return firstValueFrom(this.client.send('programs.courses.list', listCoursesDto));
  }

  findCourse(id: string) {
    return firstValueFrom(this.client.send('programs.courses.findOne', id));
  }

  updateCourse(id: string, updateCourseDto: UpdateCourseDto) {
    return firstValueFrom(
      this.client.send('programs.courses.update', {
        id,
        updateCourseDto,
      }),
    );
  }

  removeCourse(id: string) {
    return firstValueFrom(this.client.send('programs.courses.remove', id));
  }

  // Prerequisites
  createPrerequisite(createPrerequisiteDto: CreatePrerequisiteDto) {
    return firstValueFrom(
      this.client.send('programs.prerequisites.create', createPrerequisiteDto),
    );
  }

  listPrerequisites(listPrerequisitesDto: ListPrerequisitesDto) {
    return firstValueFrom(
      this.client.send('programs.prerequisites.list', listPrerequisitesDto),
    );
  }

  findPrerequisite(id: string) {
    return firstValueFrom(
      this.client.send('programs.prerequisites.findOne', id),
    );
  }

  updatePrerequisite(id: string, updatePrerequisiteDto: UpdatePrerequisiteDto) {
    return firstValueFrom(
      this.client.send('programs.prerequisites.update', {
        id,
        updatePrerequisiteDto,
      }),
    );
  }

  removePrerequisite(id: string) {
    return firstValueFrom(
      this.client.send('programs.prerequisites.remove', id),
    );
  }
}
