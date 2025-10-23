export interface AcademicYearSeedData {
  year: number;
  name: string;
  start_date: Date;
  end_date: Date;
}

export interface TermSeedData {
  academic_year_id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  status?: string;
}

export interface ClassroomSeedData {
  building: string;
  code: string;
  capacity: number;
  available?: boolean;
  resources?: string;
}

export class CalendarFixture {
  static getAcademicYears(): AcademicYearSeedData[] {
    return [
      {
        year: 2025,
        name: 'Año Académico 2025',
        start_date: new Date('2025-02-01'),
        end_date: new Date('2025-12-20'),
      },
      {
        year: 2024,
        name: 'Año Académico 2024',
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-12-20'),
      },
    ];
  }

  static getTerms(academicYearIds: Map<number, string>): TermSeedData[] {
    const terms: TermSeedData[] = [];

    const year2025Id = academicYearIds.get(2025);
    if (year2025Id) {
      terms.push(
        {
          academic_year_id: year2025Id,
          name: 'Primer Semestre',
          start_date: new Date('2025-02-01'),
          end_date: new Date('2025-06-30'),
          status: 'active',
        },
        {
          academic_year_id: year2025Id,
          name: 'Segundo Semestre',
          start_date: new Date('2025-08-01'),
          end_date: new Date('2025-12-20'),
          status: 'planned',
        },
      );
    }

    const year2024Id = academicYearIds.get(2024);
    if (year2024Id) {
      terms.push(
        {
          academic_year_id: year2024Id,
          name: 'Primer Semestre',
          start_date: new Date('2024-02-01'),
          end_date: new Date('2024-06-30'),
          status: 'completed',
        },
        {
          academic_year_id: year2024Id,
          name: 'Segundo Semestre',
          start_date: new Date('2024-08-01'),
          end_date: new Date('2024-12-20'),
          status: 'completed',
        },
      );
    }

    return terms;
  }

  static getClassrooms(): ClassroomSeedData[] {
    const classrooms: ClassroomSeedData[] = [];
    const buildings = ['Edificio A', 'Edificio B', 'Edificio C'];
    
    buildings.forEach((building, bIndex) => {
      for (let floor = 1; floor <= 2; floor++) {
        for (let room = 1; room <= 5; room++) {
          const buildingLetter = String.fromCharCode(65 + bIndex); // A, B, C
          classrooms.push({
            building,
            code: `${buildingLetter}-${floor}0${room}`,
            capacity: 40,
            available: true,
            resources: 'Proyector, Pizarra, WiFi',
          });
        }
      }
    });

    return classrooms;
  }
}
