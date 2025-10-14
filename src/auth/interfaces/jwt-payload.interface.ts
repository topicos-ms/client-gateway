export interface JwtPayload {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  roles: string[];
  student_code?: string;
  study_plan_id?: string;
  teacher_category?: string;
  iat: number;
  exp: number;
  jti: string;
}
