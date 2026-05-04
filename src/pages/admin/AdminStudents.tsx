import React, { useState, useCallback, useMemo } from 'react';
import { getStudents, saveUser, deleteUser, genId, getAttempts, getQuizzes, getStages, getCoursesByStage, getCourses, saveCourse } from '@/lib/store';
import { User, Course, Quiz, QuizAttempt, convertToGrade } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, Users, X, Ban, CheckCircle2,
  GraduationCap, ChevronDown, ChevronRight, BookOpen, Award,
  ClipboardList, ArrowLeft, Search, TrendingUp, BarChart3,
  User as UserIcon, Calendar, Hash, Shield, Eye, Scale
} from 'lucide-react';

/* ─── helpers ─── */
function gradeColor(pct: number | null): string {
  if (pct === null) return 'text-muted-foreground';
  if (pct >= 70) return 'text-success';
  if (pct >= 50) return 'text-amber-500';
  return 'text-destructive';
}

function gradeBg(pct: number | null): string {
  if (pct === null) return 'bg-muted';
  if (pct >= 70) return 'bg-success';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-destructive';
}

function ringStyle(pct: number, size: number, stroke: number) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return { circumference: c, offset: c - (pct / 100) * c, r };
}

/* ─── Grade Ring SVG ─── */
function GradeRing({ pct, size = 64, stroke = 5, label }: { pct: number; size?: number; stroke?: number; label?: string }) {
  const { circumference, offset, r } = ringStyle(pct, size, stroke);
  const center = size / 2;
  const color = pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-border" />
        <circle cx={center} cy={center} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-bold font-display" style={{ color }}>{label || `${pct}%`}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*                    STUDENT PROFILE VIEW                       */
/* ═══════════════════════════════════════════════════════════════ */
function StudentProfile({ student, onClose }: { student: User; onClose: () => void }) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [baremeEditing, setBaremeEditing] = useState<string | null>(null);
  const [baremeValue, setBaremeValue] = useState('');

  const attempts = useMemo(() =>
    getAttempts().filter(a => a.studentId === student.id && (a.status === 'completed' || a.status === 'submitted')),
    [student.id]
  );
  const quizzes = useMemo(() => getQuizzes(), []);
  const stages = useMemo(() => getStages(), []);
  const allCourses = useMemo(() => getCourses(), []);
  const [courses, setCourses] = useState(allCourses);

  const refreshCourses = useCallback(() => setCourses(getCourses()), []);

  const handleBaremeSave = useCallback((courseId: string) => {
    const val = parseFloat(baremeValue);
    if (isNaN(val) || val <= 0) { toast.error('Coefficient invalide'); return; }
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const updated = { ...course, bareme: val };
    saveCourse(updated);
    refreshCourses();
    setBaremeEditing(null);
    toast.success(`Barème mis à jour: ${val}`);
  }, [baremeValue, courses, refreshCourses]);

  // Build stage data with weighted calculation
  const stageData = useMemo(() => stages.map(stage => {
    const stageCourses = courses.filter(c => c.stageId === stage.id);
    const stageQuizzes = quizzes.filter(q => q.stageId === stage.id);
    const stageAttempts = attempts.filter(a => stageQuizzes.some(q => q.id === a.quizId));

    // Course results with barème
    const courseResults = stageCourses.map(course => {
      const courseQuizzes = stageQuizzes.filter(q => q.courseId === course.id);
      const courseAttempts = stageAttempts.filter(a => courseQuizzes.some(q => q.id === a.quizId));
      const avg = courseAttempts.length
        ? Math.round(courseAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / courseAttempts.length)
        : null;
      return {
        course,
        attempts: courseAttempts.map(att => {
          const quiz = quizzes.find(q => q.id === att.quizId);
          return { ...att, quizTitle: quiz?.title || 'Examen', gradeBase: quiz?.gradeBase || 20 };
        }),
        avg,
        bareme: course.bareme || 1,
      };
    });

    // Weighted average for this stage
    const coursesWithGrades = courseResults.filter(cr => cr.avg !== null);
    let weightedAvg: number | null = null;
    if (coursesWithGrades.length > 0) {
      const totalWeight = coursesWithGrades.reduce((s, cr) => s + cr.bareme, 0);
      const weightedSum = coursesWithGrades.reduce((s, cr) => s + (cr.avg! * cr.bareme), 0);
      weightedAvg = Math.round(weightedSum / totalWeight);
    }

    return { stage, avg: weightedAvg, count: stageAttempts.length, courseResults };
  }), [stages, courses, quizzes, attempts]);

  // Overall weighted general note
  const overallData = useMemo(() => {
    const allCoursesWithGrades: { avg: number; bareme: number }[] = [];
    stageData.forEach(sd => {
      sd.courseResults.forEach(cr => {
        if (cr.avg !== null) allCoursesWithGrades.push({ avg: cr.avg, bareme: cr.bareme });
      });
    });
    if (allCoursesWithGrades.length === 0) return { avg: 0, totalExams: 0, totalCourses: 0 };
    const totalWeight = allCoursesWithGrades.reduce((s, c) => s + c.bareme, 0);
    const weightedSum = allCoursesWithGrades.reduce((s, c) => s + (c.avg * c.bareme), 0);
    return {
      avg: Math.round(weightedSum / totalWeight),
      totalExams: attempts.length,
      totalCourses: allCoursesWithGrades.length,
    };
  }, [stageData, attempts]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Profile Header ─── */}
      <div className="rounded-2xl overflow-hidden shadow-elevated border border-border">
        <div className="bg-gradient-to-r from-primary via-primary/90 to-orange-500 px-6 py-5">
          <button onClick={onClose} className="flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white font-body transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" /> Retour aux stagiaires
          </button>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white shadow-lg border border-white/20">
              {student.fullName.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-display font-bold text-white">{student.fullName}</h2>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="flex items-center gap-1.5 text-[12px] text-white/80 font-body">
                  <Hash className="w-3.5 h-3.5" /> {student.username}
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-white/80 font-body">
                  <Calendar className="w-3.5 h-3.5" /> {student.promotion || '—'}
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-white/80 font-body">
                  <Shield className="w-3.5 h-3.5" /> {student.section === '2eme_section' ? '2ème Section' : '1ère Section'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 divide-x divide-border bg-card">
          <div className="px-5 py-4 text-center">
            <GradeRing pct={overallData.avg} size={52} stroke={4} label={convertToGrade(overallData.avg, 20)} />
            <p className="text-[10px] text-muted-foreground font-body mt-1.5 uppercase tracking-wider">Note Générale</p>
          </div>
          <div className="px-5 py-4 text-center flex flex-col items-center justify-center">
            <span className="text-2xl font-bold font-display text-foreground">{overallData.totalExams}</span>
            <p className="text-[10px] text-muted-foreground font-body mt-0.5 uppercase tracking-wider">Examens passés</p>
          </div>
          <div className="px-5 py-4 text-center flex flex-col items-center justify-center">
            <span className="text-2xl font-bold font-display text-foreground">{overallData.totalCourses}</span>
            <p className="text-[10px] text-muted-foreground font-body mt-0.5 uppercase tracking-wider">Cours évalués</p>
          </div>
          <div className="px-5 py-4 text-center flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold font-display ${overallData.avg >= 50 ? 'text-success' : 'text-destructive'}`}>
              {overallData.avg >= 50 ? 'Admis' : 'Non admis'}
            </span>
            <p className="text-[10px] text-muted-foreground font-body mt-0.5 uppercase tracking-wider">Statut</p>
          </div>
        </div>
      </div>

      {/* ─── Stages / Modules ─── */}
      {stageData.map(sd => (
        <div key={sd.stage.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-card transition-shadow hover:shadow-elevated">
          <button
            onClick={() => setExpandedStage(expandedStage === sd.stage.id ? null : sd.stage.id)}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-secondary/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-display font-bold text-foreground">
                {sd.stage.name} <span className="text-muted-foreground font-normal text-[13px]">({sd.stage.code})</span>
              </p>
              <p className="text-[11px] text-muted-foreground font-body">{sd.count} examen(s) • {sd.courseResults.length} cours</p>
            </div>
            {sd.avg !== null && (
              <div className="mr-3">
                <GradeRing pct={sd.avg} size={44} stroke={4} label={convertToGrade(sd.avg, 20)} />
              </div>
            )}
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${expandedStage === sd.stage.id ? 'rotate-180' : ''}`} />
          </button>

          {/* Expanded courses */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedStage === sd.stage.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="border-t border-border">
              {sd.courseResults.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <ClipboardList className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-[12px] text-muted-foreground font-body">Aucun examen passé dans ce module</p>
                </div>
              ) : (
                sd.courseResults.map(cr => (
                  <div key={cr.course.id} className="border-b border-border/40 last:border-0">
                    {/* Course header with barème */}
                    <div className="px-6 py-3.5 bg-secondary/20 flex items-center gap-3">
                      <ClipboardList className="w-4 h-4 text-primary/60" />
                      <span className="text-[13px] font-semibold font-body text-foreground flex-1">{cr.course.title}</span>

                      {/* Barème badge */}
                      {baremeEditing === cr.course.id ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number" min="1" step="0.5"
                            value={baremeValue}
                            onChange={e => setBaremeValue(e.target.value)}
                            className="w-16 h-7 text-[11px] rounded-lg border-primary/30 text-center"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') handleBaremeSave(cr.course.id); if (e.key === 'Escape') setBaremeEditing(null); }}
                          />
                          <button onClick={() => handleBaremeSave(cr.course.id)} className="text-[10px] px-2 py-1 rounded-md bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">OK</button>
                          <button onClick={() => setBaremeEditing(null)} className="text-[10px] px-2 py-1 rounded-md bg-secondary text-muted-foreground font-semibold hover:bg-secondary/80 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setBaremeEditing(cr.course.id); setBaremeValue(String(cr.bareme)); }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/8 hover:bg-primary/15 transition-colors group"
                          title="Modifier le barème"
                        >
                          <Scale className="w-3 h-3 text-primary/60" />
                          <span className="text-[10px] font-semibold text-primary font-body">Coef. {cr.bareme}</span>
                          <Pencil className="w-2.5 h-2.5 text-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}

                      {cr.avg !== null && (
                        <span className={`text-[13px] font-bold ml-2 ${gradeColor(cr.avg)}`}>{convertToGrade(cr.avg, 20)}</span>
                      )}
                    </div>

                    {/* Exam rows */}
                    <table className="w-full">
                      <thead>
                        <tr className="bg-secondary/5">
                          <th className="text-left px-6 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Examen</th>
                          <th className="text-center px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Score</th>
                          <th className="text-center px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Note</th>
                          <th className="text-center px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Progression</th>
                          <th className="text-right px-6 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cr.attempts.map(att => (
                          <tr key={att.id} className="border-t border-border/20 hover:bg-secondary/10 transition-colors">
                            <td className="px-6 py-3 text-[12px] font-medium font-body text-foreground">{att.quizTitle}</td>
                            <td className="px-3 py-3 text-center text-[12px] font-body">
                              <span className="text-primary font-semibold">{att.correctAnswers || 0}</span>
                              <span className="text-muted-foreground">/{att.totalQuestions || 0}</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`text-[12px] font-bold ${gradeColor(att.percentage || 0)}`}>
                                {convertToGrade(att.percentage || 0, att.gradeBase)}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-500 ${gradeBg(att.percentage || 0)}`} style={{ width: `${att.percentage || 0}%` }} />
                                </div>
                                <span className="text-[11px] font-semibold font-body min-w-[32px] text-right">{att.percentage || 0}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right text-[11px] text-muted-foreground font-body">
                              {att.completedAt ? new Date(att.completedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Empty state */}
      {attempts.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-16 text-center shadow-card">
          <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-[13px] text-muted-foreground font-body">Ce stagiaire n'a passé aucun examen</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*                     NOTES OVERVIEW TABLE                      */
/* ═══════════════════════════════════════════════════════════════ */
function NotesTable({ onViewStudent }: { onViewStudent: (s: User) => void }) {
  const students = getStudents();
  const attempts = getAttempts().filter(a => a.status === 'completed' || a.status === 'submitted');
  const quizzes = getQuizzes();
  const stages = getStages();
  const courses = getCourses();

  const rows = students.map(student => {
    const studentAttempts = attempts.filter(a => a.studentId === student.id);

    const stageAvgs: Record<string, number | null> = {};
    stages.forEach(stage => {
      const stageCourses = courses.filter(c => c.stageId === stage.id);
      const stageQuizzes = quizzes.filter(q => q.stageId === stage.id);
      const stageAttempts = studentAttempts.filter(a => stageQuizzes.some(q => q.id === a.quizId));

      // Weighted by barème
      const courseGrades = stageCourses.map(course => {
        const courseQuizzes = stageQuizzes.filter(q => q.courseId === course.id);
        const courseAttempts = stageAttempts.filter(a => courseQuizzes.some(q => q.id === a.quizId));
        if (courseAttempts.length === 0) return null;
        const avg = Math.round(courseAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / courseAttempts.length);
        return { avg, bareme: course.bareme || 1 };
      }).filter((g): g is { avg: number; bareme: number } => g !== null);

      if (courseGrades.length === 0) { stageAvgs[stage.id] = null; return; }
      const totalWeight = courseGrades.reduce((s, g) => s + g.bareme, 0);
      const weightedSum = courseGrades.reduce((s, g) => s + (g.avg * g.bareme), 0);
      stageAvgs[stage.id] = Math.round(weightedSum / totalWeight);
    });

    // Overall weighted
    const allGrades: { avg: number; bareme: number }[] = [];
    stages.forEach(stage => {
      const stageCourses = courses.filter(c => c.stageId === stage.id);
      const stageQuizzes = quizzes.filter(q => q.stageId === stage.id);
      stageCourses.forEach(course => {
        const courseQuizzes = stageQuizzes.filter(q => q.courseId === course.id);
        const courseAttempts = studentAttempts.filter(a => courseQuizzes.some(q => q.id === a.quizId));
        if (courseAttempts.length > 0) {
          const avg = Math.round(courseAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / courseAttempts.length);
          allGrades.push({ avg, bareme: course.bareme || 1 });
        }
      });
    });

    let overallAvg: number | null = null;
    if (allGrades.length > 0) {
      const totalWeight = allGrades.reduce((s, g) => s + g.bareme, 0);
      const weightedSum = allGrades.reduce((s, g) => s + (g.avg * g.bareme), 0);
      overallAvg = Math.round(weightedSum / totalWeight);
    }

    return { student, overallAvg, stageAvgs };
  });

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-elevated">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-secondary/30">
            <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Stagiaire</th>
            <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Matricule</th>
            <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Section</th>
            {stages.map(s => (
              <th key={s.id} className="text-center px-3 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">{s.code}</th>
            ))}
            <th className="text-center px-4 py-3.5 text-[11px] font-semibold text-primary uppercase tracking-wider font-body bg-primary/5">Générale</th>
            <th className="text-right px-5 py-3.5"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ student, overallAvg, stageAvgs }) => (
            <tr key={student.id}
              className="border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer group"
              onClick={() => onViewStudent(student)}
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg gradient-muscle flex items-center justify-center text-[11px] font-bold text-primary-foreground shadow-sm group-hover:scale-110 transition-transform">
                    {student.fullName.charAt(0)}
                  </div>
                  <span className="text-[13px] font-semibold font-body text-foreground group-hover:text-primary transition-colors">{student.fullName}</span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-[12px] text-muted-foreground font-body font-medium">{student.username}</td>
              <td className="px-4 py-3.5">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/8 text-primary font-semibold font-body">
                  {student.section === '2eme_section' ? '2ème' : '1ère'}
                </span>
              </td>
              {stages.map(stage => (
                <td key={stage.id} className="px-3 py-3.5 text-center">
                  {stageAvgs[stage.id] !== null ? (
                    <span className={`text-[12px] font-bold ${gradeColor(stageAvgs[stage.id])}`}>
                      {convertToGrade(stageAvgs[stage.id]!, 20)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">—</span>
                  )}
                </td>
              ))}
              <td className="px-4 py-3.5 text-center bg-primary/5">
                {overallAvg !== null ? (
                  <span className="text-[13px] font-bold text-primary font-display">{convertToGrade(overallAvg, 20)}</span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-5 py-3.5 text-right">
                <span className="text-[11px] font-semibold text-primary/50 group-hover:text-primary font-body flex items-center gap-1 ml-auto transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Profil
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="py-12 text-center">
          <Award className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-[12px] text-muted-foreground font-body">Aucun stagiaire</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*                      MAIN COMPONENT                           */
/* ═══════════════════════════════════════════════════════════════ */
type MainTab = 'list' | 'notes';

export default function AdminStudents() {
  const [students, setStudents] = useState(getStudents());
  const [activeTab, setActiveTab] = useState<MainTab>('list');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [profileStudent, setProfileStudent] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ fullName: '', username: '', password: '', promotion: '', section: '1ere_section' as string });

  const refresh = () => setStudents(getStudents());

  const handleSave = () => {
    const fullName = form.fullName.trim();
    const username = form.username.trim().toUpperCase();
    if (!fullName || !username) { toast.error('Nom et matricule requis'); return; }
    const user: User = {
      id: editing?.id || genId(), fullName,
      username,
      password: form.password || editing?.password || 'student123',
      role: 'student', group: form.promotion, promotion: form.promotion,
      section: form.section as User['section'],
      disabled: editing?.disabled || false,
      createdAt: editing?.createdAt || new Date().toISOString(),
      lastLogin: editing?.lastLogin,
    };
    saveUser(user);
    setShowForm(false); setEditing(null);
    setForm({ fullName: '', username: '', password: '', promotion: '', section: '1ere_section' });
    refresh();
    toast.success(editing ? 'Stagiaire modifié' : 'Stagiaire ajouté');
  };

  const toggleDisable = (s: User) => {
    saveUser({ ...s, disabled: !s.disabled });
    refresh();
    toast.success(s.disabled ? 'Stagiaire activé' : 'Stagiaire désactivé');
  };

  const handleDelete = (s: User) => {
    deleteUser(s.id);
    refresh();
    toast.success('Stagiaire supprimé');
  };

  // Filtered students
  const filtered = searchQuery.trim()
    ? students.filter(s =>
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students;

  // If viewing a student's profile
  if (profileStudent) {
    return <StudentProfile student={profileStudent} onClose={() => setProfileStudent(null)} />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-muscle flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            Stagiaires
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1 font-body ml-[46px]">{students.length} enregistrés</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'list' && (
            <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ fullName: '', username: '', password: '', promotion: '', section: '1ere_section' }); }}
              className="gradient-muscle text-primary-foreground hover:opacity-90 rounded-xl h-10 text-[13px] shadow-sm gap-2 px-5">
              <Plus className="w-4 h-4" /> Ajouter
            </Button>
          )}
        </div>
      </div>

      {/* Tab switch + search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
          {[
            { id: 'list' as MainTab, label: 'Liste des Stagiaires', icon: Users },
            { id: 'notes' as MainTab, label: 'Notes & Résultats', icon: Award },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-body font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'gradient-muscle text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'list' && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un stagiaire..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-64 rounded-xl bg-card border-border text-[13px]"
            />
          </div>
        )}
      </div>

      {/* NOTES TAB */}
      {activeTab === 'notes' && (
        <NotesTable onViewStudent={s => setProfileStudent(s)} />
      )}

      {/* LIST TAB */}
      {activeTab === 'list' && (
        <>
          {showForm && (
            <div className="rounded-2xl bg-card border border-border p-6 animate-slide-up shadow-elevated">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-[15px] font-semibold flex items-center gap-2 text-foreground">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  {editing ? 'Modifier le Stagiaire' : 'Nouveau Stagiaire'}
                </h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Nom complet" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="bg-background border-border h-10 rounded-xl text-[13px]" />
                <Input placeholder="Matricule (ex: 2401/FAR/25)" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="bg-background border-border h-10 rounded-xl text-[13px] uppercase" />
                <Input placeholder="Mot de passe" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="bg-background border-border h-10 rounded-xl text-[13px]" />
                <Input placeholder="Promotion (ex: 2024-2025)" value={form.promotion} onChange={e => setForm({ ...form, promotion: e.target.value })} className="bg-background border-border h-10 rounded-xl text-[13px]" />
                <select value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}
                  className="h-10 rounded-xl bg-background border border-border px-3 text-[13px] text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow">
                  <option value="1ere_section">1ère Section</option>
                  <option value="2eme_section">2ème Section</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl text-[13px] h-9">Annuler</Button>
                <Button onClick={handleSave} className="gradient-muscle text-primary-foreground rounded-xl text-[13px] h-9 shadow-sm">Enregistrer</Button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="rounded-xl bg-card border border-border p-16 text-center">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-[13px] font-body">
                {searchQuery ? 'Aucun résultat trouvé' : 'Aucun stagiaire enregistré'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Nom</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Matricule</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Section</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Promotion</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Note Générale</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Examens</th>
                    <th className="text-center px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Statut</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const studentAttempts = getAttempts().filter(a => a.studentId === s.id && (a.status === 'completed' || a.status === 'submitted'));
                    const allCourses = getCourses();
                    const allQuizzes = getQuizzes();
                    const allGrades: { avg: number; bareme: number }[] = [];
                    getStages().forEach(stage => {
                      const stageCourses = allCourses.filter(c => c.stageId === stage.id);
                      const stageQuizzes = allQuizzes.filter(q => q.stageId === stage.id);
                      stageCourses.forEach(course => {
                        const courseQuizzes = stageQuizzes.filter(q => q.courseId === course.id);
                        const courseAttempts = studentAttempts.filter(a => courseQuizzes.some(q => q.id === a.quizId));
                        if (courseAttempts.length > 0) {
                          const avg = Math.round(courseAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / courseAttempts.length);
                          allGrades.push({ avg, bareme: course.bareme || 1 });
                        }
                      });
                    });
                    let overallAvg: number | null = null;
                    if (allGrades.length > 0) {
                      const totalWeight = allGrades.reduce((sum, g) => sum + g.bareme, 0);
                      overallAvg = Math.round(allGrades.reduce((sum, g) => sum + (g.avg * g.bareme), 0) / totalWeight);
                    }

                    return (
                      <tr key={s.id}
                        className="border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer"
                        onClick={() => setProfileStudent(s)}
                      >
                        <td className="px-5 py-3">
                          <span className="text-[13px] font-medium font-body text-foreground">{s.fullName}</span>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-muted-foreground font-body">{s.username}</td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/8 text-primary font-semibold font-body">
                            {s.section === '2eme_section' ? '2ème' : '1ère'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-muted-foreground font-body">{s.promotion || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {overallAvg !== null ? (
                            <span className={`text-[13px] font-bold ${gradeColor(overallAvg)}`}>{convertToGrade(overallAvg, 20)}</span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-[12px] font-body text-muted-foreground">
                          {studentAttempts.length}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold font-body ${
                            s.disabled ? 'bg-destructive/8 text-destructive' : 'bg-success/8 text-success'
                          }`}>
                            {s.disabled ? <Ban className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                            {s.disabled ? 'Inactif' : 'Actif'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-0.5 justify-end">
                            <button onClick={() => { setEditing(s); setForm({ fullName: s.fullName, username: s.username, password: '', promotion: s.promotion || '', section: s.section || '1ere_section' }); setShowForm(true); }}
                              title="Modifier" className="p-1.5 rounded-lg hover:bg-primary/8 text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => toggleDisable(s)} title={s.disabled ? 'Activer' : 'Désactiver'}
                              className="p-1.5 rounded-lg hover:bg-amber-500/8 text-muted-foreground hover:text-amber-500 transition-colors"><Ban className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(s)} title="Supprimer"
                              className="p-1.5 rounded-lg hover:bg-destructive/8 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
