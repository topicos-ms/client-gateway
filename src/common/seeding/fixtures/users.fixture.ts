export interface UserSeedData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  user_type: 'ADMIN' | 'TEACHER' | 'STUDENT';
  status?: string;
}

export interface StudentSeedData extends UserSeedData {
  user_type: 'STUDENT';
  code: string;
  study_plan_id: string;
  enrolled_at: Date;
  birth_date?: Date;
  sex?: string;
}

export interface TeacherSeedData extends UserSeedData {
  user_type: 'TEACHER';
  // Note: The auth-ms DTO doesn't currently support category, workload, contract_type, hired_at
  // These fields exist in the entity but not in the DTO
}

export interface AdminSeedData extends UserSeedData {
  user_type: 'ADMIN';
}

export class UsersFixture {
  static getAdmins(): AdminSeedData[] {
    return [
      {
        first_name: 'Administrador',
        last_name: 'Principal',
        email: 'admin@uagrm.edu.bo',
        password: 'Admin123!',
        phone: '77700001',
        user_type: 'ADMIN',
        status: 'Active',
      },
    ];
  }

  static getTeachers(count: number = 5): TeacherSeedData[] {
    const teachers: TeacherSeedData[] = [];
    const firstNames = ['Juan', 'María', 'Pedro', 'Ana', 'Luis', 'Carmen', 'José', 'Isabel'];
    const lastNames = ['García', 'Martínez', 'López', 'Sánchez', 'Ramírez', 'Torres'];

    for (let i = 1; i <= count; i++) {
      teachers.push({
        first_name: firstNames[i % firstNames.length],
        last_name: `${lastNames[i % lastNames.length]} ${lastNames[(i + 1) % lastNames.length]}`,
        email: `docente${i}@uagrm.edu.bo`,
        password: 'Docente123!',
        phone: `7770${String(i).padStart(4, '0')}`,
        user_type: 'TEACHER',
        status: 'Active',
      });
    }

    return teachers;
  }

  static getStudents(count: number = 10, defaultStudyPlanId?: string): StudentSeedData[] {
    const students: StudentSeedData[] = [];
    const firstNames = ['Juan', 'María', 'Pedro', 'Ana', 'Luis', 'Carmen', 'José', 'Isabel', 'Miguel', 'Laura'];
    const lastNames = ['García', 'Martínez', 'López', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Vega'];

    for (let i = 1; i <= count; i++) {
      students.push({
        first_name: firstNames[i % firstNames.length],
        last_name: `${lastNames[i % lastNames.length]} ${lastNames[(i + 2) % lastNames.length]}`,
        email: `estudiante${i}@est.uagrm.edu.bo`,
        password: 'Estudiante123!',
        phone: `6660${String(i).padStart(4, '0')}`,
        user_type: 'STUDENT',
        status: 'Active',
        code: `EST${String(2024000 + i).padStart(9, '0')}`,
        study_plan_id: defaultStudyPlanId || '00000000-0000-0000-0000-000000000000',
        enrolled_at: new Date(2024, 1, 1),
        birth_date: new Date(1998 + (i % 8), i % 12, (i % 28) + 1),
        sex: i % 2 === 0 ? 'M' : 'F',
      });
    }

    return students;
  }
}
