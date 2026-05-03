import { User, Course, Quiz, QuizAttempt, Stage } from '@/types';

const KEYS = {
  users: 'lms_users',
  courses: 'lms_courses',
  quizzes: 'lms_quizzes',
  attempts: 'lms_attempts',
  currentUser: 'lms_current_user',
  stages: 'lms_stages',
};

function get<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeStudentMatricule(username: string): string {
  const legacy = username.match(/^MAT-(\d{4})$/i);
  if (legacy) return `${legacy[1]}/FAR/25`;

  const far25 = username.match(/^(\d{4})\/FAR\/25$/i);
  if (far25) return `${far25[1]}/FAR/25`;

  return username;
}

function sanitizeUsers(users: Array<User & { email?: string }>): User[] {
  return users.map(user => {
    const { email: _email, ...rest } = user;
    if (user.role !== 'student') return rest;

    return {
      ...rest,
      username: normalizeStudentMatricule(user.username),
    };
  });
}

function createTestQuestions(prefix: string): Quiz['questions'] {
  return [
    {
      id: `${prefix}-q1`,
      text: 'Question test 1',
      type: 'single',
      answers: [
        { id: `${prefix}-q1-a1`, text: 'Réponse A', isCorrect: true },
        { id: `${prefix}-q1-a2`, text: 'Réponse B', isCorrect: false },
      ],
      timerSeconds: 30,
      order: 1,
    },
    {
      id: `${prefix}-q2`,
      text: 'Question test 2',
      type: 'single',
      answers: [
        { id: `${prefix}-q2-a1`, text: 'Réponse A', isCorrect: false },
        { id: `${prefix}-q2-a2`, text: 'Réponse B', isCorrect: true },
      ],
      timerSeconds: 30,
      order: 2,
    },
  ];
}

function ensurePublishedTestsPerCourseAndStage() {
  const quizzes = get<Quiz[]>(KEYS.quizzes, []);
  const courses = get<Course[]>(KEYS.courses, []);
  const stages = get<Stage[]>(KEYS.stages, []);
  let changed = false;

  // Keep auto-generated tests in a launch-ready state unless already active.
  for (const quiz of quizzes) {
    const isAutoCourseTest = quiz.id.startsWith('quiz-course-test-');
    const isAutoStageTest = quiz.id.startsWith('quiz-stage-general-');
    if ((isAutoCourseTest || isAutoStageTest) && quiz.status !== 'active' && quiz.status !== 'published') {
      quiz.status = 'published';
      changed = true;
    }
  }

  for (const course of courses) {
    const testQuizId = `quiz-course-test-${course.id}`;
    if (!quizzes.some(q => q.id === testQuizId)) {
      quizzes.push({
        id: testQuizId,
        courseId: course.id,
        stageId: course.stageId,
        title: `Test - ${course.title}`,
        description: `Test du cours ${course.title}`,
        questions: createTestQuestions(`course-${course.id}`),
        status: 'published',
        createdAt: new Date().toISOString(),
        gradeBase: 20,
      });
      changed = true;
    }
  }

  for (const stage of stages) {
    const generalQuizId = `quiz-stage-general-${stage.id}`;
    if (!quizzes.some(q => q.id === generalQuizId)) {
      const fallbackCourse = courses.find(c => c.stageId === stage.id);
      quizzes.push({
        id: generalQuizId,
        courseId: fallbackCourse?.id || '',
        stageId: stage.id,
        title: `Test Général - ${stage.code}`,
        description: `Test général du stage ${stage.name}`,
        questions: createTestQuestions(`stage-${stage.id}`),
        status: 'published',
        createdAt: new Date().toISOString(),
        gradeBase: 20,
      });
      changed = true;
    }
  }

  if (changed) set(KEYS.quizzes, quizzes);
}

// Seed default admin & stages
function seedData() {
  const users = sanitizeUsers(get<Array<User & { email?: string }>>(KEYS.users, []));
  set(KEYS.users, users);

  if (!users.find(u => u.role === 'admin')) {
    users.push({
      id: 'admin-1',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      fullName: 'Administrateur',
      createdAt: new Date().toISOString(),
    });
    set(KEYS.users, users);
  }

  // Seed dummy Moroccan students
  const students = users.filter(u => u.role === 'student');
  if (students.length === 0) {
    const dummyStudents: User[] = [
      { id: 'stu-1', username: '2401/FAR/25', password: 'student123', role: 'student', fullName: 'Youssef El Amrani', promotion: '2024-2025', section: '1ere_section', createdAt: new Date().toISOString(), lastLogin: new Date(Date.now() - 3600000).toISOString() },
      { id: 'stu-2', username: '2402/FAR/25', password: 'student123', role: 'student', fullName: 'Amine Benali', promotion: '2024-2025', section: '1ere_section', createdAt: new Date().toISOString(), lastLogin: new Date(Date.now() - 7200000).toISOString() },
      { id: 'stu-3', username: '2403/FAR/25', password: 'student123', role: 'student', fullName: 'Rachid Tazi', promotion: '2024-2025', section: '2eme_section', createdAt: new Date().toISOString() },
      { id: 'stu-4', username: '2404/FAR/25', password: 'student123', role: 'student', fullName: 'Khalid Moussa', promotion: '2024-2025', section: '2eme_section', createdAt: new Date().toISOString() },
      { id: 'stu-5', username: '2405/FAR/25', password: 'student123', role: 'student', fullName: 'Omar Idrissi', promotion: '2023-2024', section: '1ere_section', createdAt: new Date().toISOString(), lastLogin: new Date(Date.now() - 86400000).toISOString() },
      { id: 'stu-6', username: '2406/FAR/25', password: 'student123', role: 'student', fullName: 'Hamza Berrada', promotion: '2023-2024', section: '1ere_section', createdAt: new Date().toISOString() },
      { id: 'stu-7', username: '2407/FAR/25', password: 'student123', role: 'student', fullName: 'Samir Chraibi', promotion: '2024-2025', section: '2eme_section', createdAt: new Date().toISOString() },
      { id: 'stu-8', username: '2408/FAR/25', password: 'student123', role: 'student', fullName: 'Mehdi Fassi', promotion: '2024-2025', section: '1ere_section', createdAt: new Date().toISOString() },
    ];
    set(KEYS.users, [...users, ...dummyStudents]);
  }

  const stages = get<Stage[]>(KEYS.stages, []);
  if (stages.length === 0) {
    const defaultStages: Stage[] = [
      { id: 'stage-cat1', name: 'CAT 1', code: 'CAT1', description: 'Catégorie 1 — Formation initiale', order: 1, createdAt: new Date().toISOString() },
      { id: 'stage-cat2', name: 'CAT 2', code: 'CAT2', description: 'Catégorie 2 — Formation avancée', order: 2, createdAt: new Date().toISOString() },
      { id: 'stage-be', name: 'BE', code: 'BE', description: 'Brevet Élémentaire', order: 3, createdAt: new Date().toISOString() },
      { id: 'stage-bs', name: 'BS', code: 'BS', description: 'Brevet Supérieur', order: 4, createdAt: new Date().toISOString() },
    ];
    set(KEYS.stages, defaultStages);
  }

  // Seed courses
  const courses = get<Course[]>(KEYS.courses, []);
  if (courses.length === 0) {
    const defaultCourses: Course[] = [
      { id: 'course-1', stageId: 'stage-cat1', title: 'Anatomie musculaire', description: 'Bases de l\'anatomie', files: [], assignedStudents: [], createdAt: new Date().toISOString() },
      { id: 'course-2', stageId: 'stage-cat1', title: 'Physiologie du sport', description: 'Fonctionnement du corps', files: [], assignedStudents: [], createdAt: new Date().toISOString() },
      { id: 'course-3', stageId: 'stage-cat2', title: 'Entraînement avancé', description: 'Techniques avancées', files: [], assignedStudents: [], createdAt: new Date().toISOString() },
      { id: 'course-4', stageId: 'stage-be', title: 'Biomécanique', description: 'Mécanique du mouvement', files: [], assignedStudents: [], createdAt: new Date().toISOString() },
      { id: 'course-5', stageId: 'stage-bs', title: 'Nutrition sportive', description: 'Alimentation et performance', files: [], assignedStudents: [], createdAt: new Date().toISOString() },
    ];
    set(KEYS.courses, defaultCourses);
  }

  // Seed quizzes
  const quizzes = get<Quiz[]>(KEYS.quizzes, []);
  if (quizzes.length === 0) {
    const defaultQuizzes: Quiz[] = [
      { id: 'quiz-1', courseId: 'course-1', stageId: 'stage-cat1', title: 'Examen Anatomie', description: '', questions: [
        { id: 'q1', text: 'Quel muscle est le plus grand du corps ?', type: 'single', answers: [{ id: 'a1', text: 'Quadriceps', isCorrect: true }, { id: 'a2', text: 'Biceps', isCorrect: false }], timerSeconds: 30, order: 1 },
        { id: 'q2', text: 'Le cœur est un muscle ?', type: 'single', answers: [{ id: 'a3', text: 'Vrai', isCorrect: true }, { id: 'a4', text: 'Faux', isCorrect: false }], timerSeconds: 30, order: 2 },
      ], status: 'completed', createdAt: new Date().toISOString(), gradeBase: 20 },
      { id: 'quiz-2', courseId: 'course-2', stageId: 'stage-cat1', title: 'Examen Physiologie', description: '', questions: [
        { id: 'q3', text: 'Fréquence cardiaque max ?', type: 'single', answers: [{ id: 'a5', text: '220 - âge', isCorrect: true }, { id: 'a6', text: '200 - âge', isCorrect: false }], timerSeconds: 30, order: 1 },
      ], status: 'completed', createdAt: new Date().toISOString(), gradeBase: 20 },
      { id: 'quiz-3', courseId: 'course-3', stageId: 'stage-cat2', title: 'Examen Entraînement', description: '', questions: [
        { id: 'q4', text: 'Repos optimal entre séries ?', type: 'single', answers: [{ id: 'a7', text: '60-90s', isCorrect: true }, { id: 'a8', text: '5min', isCorrect: false }], timerSeconds: 30, order: 1 },
      ], status: 'completed', createdAt: new Date().toISOString(), gradeBase: 20 },
      { id: 'quiz-4', courseId: 'course-4', stageId: 'stage-be', title: 'Examen Biomécanique', description: '', questions: [
        { id: 'q5', text: 'La force = masse × ?', type: 'single', answers: [{ id: 'a9', text: 'Accélération', isCorrect: true }, { id: 'a10', text: 'Vitesse', isCorrect: false }], timerSeconds: 30, order: 1 },
      ], status: 'completed', createdAt: new Date().toISOString(), gradeBase: 20 },
    ];
    set(KEYS.quizzes, defaultQuizzes);
  }

  // Always keep test quizzes available for each course and each stage.
  ensurePublishedTestsPerCourseAndStage();

  // Seed attempts
  const attempts = get<QuizAttempt[]>(KEYS.attempts, []);
  if (attempts.length === 0) {
    const dummyAttempts: QuizAttempt[] = [
      { id: 'att-1', quizId: 'quiz-1', studentId: 'stu-1', answers: { q1: ['a1'], q2: ['a3'] }, currentQuestion: 2, status: 'completed', completedAt: new Date(Date.now() - 86400000).toISOString(), correctAnswers: 2, totalQuestions: 2, percentage: 100 },
      { id: 'att-2', quizId: 'quiz-2', studentId: 'stu-1', answers: { q3: ['a5'] }, currentQuestion: 1, status: 'completed', completedAt: new Date(Date.now() - 72000000).toISOString(), correctAnswers: 1, totalQuestions: 1, percentage: 100 },
      { id: 'att-3', quizId: 'quiz-3', studentId: 'stu-1', answers: { q4: ['a8'] }, currentQuestion: 1, status: 'completed', completedAt: new Date(Date.now() - 50000000).toISOString(), correctAnswers: 0, totalQuestions: 1, percentage: 0 },
      { id: 'att-4', quizId: 'quiz-1', studentId: 'stu-2', answers: { q1: ['a1'], q2: ['a4'] }, currentQuestion: 2, status: 'completed', completedAt: new Date(Date.now() - 40000000).toISOString(), correctAnswers: 1, totalQuestions: 2, percentage: 50 },
      { id: 'att-5', quizId: 'quiz-3', studentId: 'stu-2', answers: { q4: ['a7'] }, currentQuestion: 1, status: 'completed', completedAt: new Date(Date.now() - 30000000).toISOString(), correctAnswers: 1, totalQuestions: 1, percentage: 100 },
      { id: 'att-6', quizId: 'quiz-4', studentId: 'stu-3', answers: { q5: ['a9'] }, currentQuestion: 1, status: 'completed', completedAt: new Date(Date.now() - 20000000).toISOString(), correctAnswers: 1, totalQuestions: 1, percentage: 100 },
      { id: 'att-7', quizId: 'quiz-1', studentId: 'stu-5', answers: { q1: ['a2'], q2: ['a3'] }, currentQuestion: 2, status: 'completed', completedAt: new Date(Date.now() - 10000000).toISOString(), correctAnswers: 1, totalQuestions: 2, percentage: 50 },
      { id: 'att-8', quizId: 'quiz-2', studentId: 'stu-5', answers: { q3: ['a6'] }, currentQuestion: 1, status: 'completed', completedAt: new Date(Date.now() - 5000000).toISOString(), correctAnswers: 0, totalQuestions: 1, percentage: 0 },
    ];
    set(KEYS.attempts, dummyAttempts);
  }
}

seedData();

// Auth
export function login(username: string, password: string): User | null {
  const users = get<User[]>(KEYS.users, []);
  const user = users.find(u => u.username === username && u.password === password && !u.disabled);
  if (user) {
    const updated = { ...user, lastLogin: new Date().toISOString() };
    set(KEYS.users, users.map(u => u.id === user.id ? updated : u));
    set(KEYS.currentUser, updated);
    return updated;
  }
  return null;
}

export function logout() { localStorage.removeItem(KEYS.currentUser); }
export function getCurrentUser(): User | null { return get<User | null>(KEYS.currentUser, null); }

// Users
export function getUsers(): User[] { return get<User[]>(KEYS.users, []); }
export function getStudents(): User[] { return getUsers().filter(u => u.role === 'student'); }
export function saveUser(user: User) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) users[idx] = user; else users.push(user);
  set(KEYS.users, users);
}
export function deleteUser(id: string) {
  set(KEYS.users, getUsers().filter(u => u.id !== id));
}

// Stages
export function getStages(): Stage[] { return get<Stage[]>(KEYS.stages, []).sort((a, b) => a.order - b.order); }
export function saveStage(stage: Stage) {
  const stages = get<Stage[]>(KEYS.stages, []);
  const idx = stages.findIndex(s => s.id === stage.id);
  if (idx >= 0) stages[idx] = stage; else stages.push(stage);
  set(KEYS.stages, stages);
}
export function deleteStage(id: string) {
  set(KEYS.stages, get<Stage[]>(KEYS.stages, []).filter(s => s.id !== id));
}

// Courses
export function getCourses(): Course[] { return get<Course[]>(KEYS.courses, []); }
export function getCoursesByStage(stageId: string): Course[] { return getCourses().filter(c => c.stageId === stageId); }
export function saveCourse(course: Course) {
  const courses = getCourses();
  const idx = courses.findIndex(c => c.id === course.id);
  if (idx >= 0) courses[idx] = course; else courses.push(course);
  set(KEYS.courses, courses);
}
export function deleteCourse(id: string) {
  set(KEYS.courses, getCourses().filter(c => c.id !== id));
}

// Quizzes
export function getQuizzes(): Quiz[] { return get<Quiz[]>(KEYS.quizzes, []); }
export function saveQuiz(quiz: Quiz) {
  const quizzes = getQuizzes();
  const idx = quizzes.findIndex(q => q.id === quiz.id);
  if (idx >= 0) quizzes[idx] = quiz; else quizzes.push(quiz);
  set(KEYS.quizzes, quizzes);
}
export function deleteQuiz(id: string) {
  set(KEYS.quizzes, getQuizzes().filter(q => q.id !== id));
}

// Attempts
export function getAttempts(): QuizAttempt[] { return get<QuizAttempt[]>(KEYS.attempts, []); }
export function saveAttempt(attempt: QuizAttempt) {
  const attempts = getAttempts();
  const idx = attempts.findIndex(a => a.id === attempt.id);
  if (idx >= 0) attempts[idx] = attempt; else attempts.push(attempt);
  set(KEYS.attempts, attempts);
}
export function getStudentAttempts(studentId: string): QuizAttempt[] {
  return getAttempts().filter(a => a.studentId === studentId);
}
export function getQuizAttempts(quizId: string): QuizAttempt[] {
  return getAttempts().filter(a => a.quizId === quizId);
}

// ID generator
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

