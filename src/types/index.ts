export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'student';
  fullName: string;
  group?: string;
  promotion?: string;
  section?: '1ere_section' | '2eme_section';
  disabled?: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Stage {
  id: string;
  name: string;
  code: string; // CAT1, CAT2, BE, BS...
  description: string;
  order: number;
  createdAt: string;
}

export interface Course {
  id: string;
  stageId: string;
  title: string;
  description: string;
  files: CourseFile[];
  assignedStudents: string[];
  createdAt: string;
  bareme?: number;
}

export interface CourseFile {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'video' | 'ppt' | 'attachment';
  url: string;
  size: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  stageId?: string;
  title: string;
  description: string;
  questions: Question[];
  status: 'draft' | 'published' | 'active' | 'completed';
  createdAt: string;
  startedAt?: string;
  lockOnStart?: boolean;
  autoSubmit?: boolean;
  gradeBase?: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'single' | 'multiple';
  answers: Answer[];
  timerSeconds: number;
  order: number;
}

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: Record<string, string[]>;
  currentQuestion: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'submitted';
  startedAt?: string;
  completedAt?: string;
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  percentage?: number;
}

export interface StudentStatus {
  studentId: string;
  studentName: string;
  online: boolean;
  quizStatus?: 'waiting' | 'started' | 'in_progress' | 'completed';
  currentQuestion?: number;
  totalQuestions?: number;
}

export function convertToGrade(percentage: number, base: number): string {
  const grade = (percentage / 100) * base;
  return grade % 1 === 0 ? `${grade}/${base}` : `${grade.toFixed(2)}/${base}`;
}
