import React from 'react';
import { getQuizzes, getAttempts, getCourses, getStages } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Play, CheckCircle2, Clock3, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentQuizList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const quizzes = getQuizzes().filter(q => q.status === 'active' || q.status === 'published');
  const attempts = getAttempts().filter(a => a.studentId === (user?.id || ''));
  const courses = getCourses();
  const stages = getStages();

  const latestAttemptByQuiz = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    const current = latestAttemptByQuiz.get(attempt.quizId);
    if (!current) {
      latestAttemptByQuiz.set(attempt.quizId, attempt);
      continue;
    }

    const currentTime = new Date(current.completedAt || current.startedAt || 0).getTime();
    const nextTime = new Date(attempt.completedAt || attempt.startedAt || 0).getTime();
    if (nextTime >= currentTime) latestAttemptByQuiz.set(attempt.quizId, attempt);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Quiz Disponibles</h1>
        <p className="text-[13px] text-muted-foreground mt-1 font-body">Examens non commencés et en cours</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-16 text-center shadow-card">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-[13px] font-body">Aucun quiz disponible</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map(q => {
            const latestAttempt = latestAttemptByQuiz.get(q.id);
            const isCompleted = latestAttempt?.status === 'completed' || latestAttempt?.status === 'submitted';
            const course = courses.find(c => c.id === q.courseId);
            const stage = stages.find(s => s.id === q.stageId || s.id === course?.stageId);

            return (
              <div key={q.id} className="rounded-2xl bg-card border border-border p-5 hover:shadow-card-hover shadow-card transition-all">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl gradient-muscle flex items-center justify-center shrink-0">
                      <ClipboardList className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-[14px] font-semibold text-foreground truncate">{q.title}</h3>
                      <p className="text-[11px] text-muted-foreground font-body truncate">
                        {q.questions.length} questions • {course?.title || 'Test général de stage'}
                        {stage ? ` • ${stage.code}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-body inline-flex items-center gap-1.5 ${
                      isCompleted
                        ? 'bg-success/10 text-success'
                        : q.status === 'active'
                          ? 'bg-info/10 text-info'
                          : 'bg-warning/10 text-warning'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock3 className="w-3 h-3" />}
                      {isCompleted ? 'Terminé' : q.status === 'active' ? 'En cours' : 'Non commencé'}
                    </span>

                    {isCompleted ? (
                      <Button variant="ghost" onClick={() => navigate('/student/results')} className="rounded-xl h-9 text-[12px]">
                        Voir résultat
                      </Button>
                    ) : (
                      <Button onClick={() => navigate(`/student/quizzes/${q.id}`)} className="gradient-muscle text-primary-foreground hover:opacity-90 rounded-xl h-9 text-[13px] shadow-sm">
                        <Play className="w-3.5 h-3.5 mr-1.5" /> Commencer
                      </Button>
                    )}
                  </div>
                </div>

                {q.description && (
                  <div className="mt-3 text-[12px] text-muted-foreground font-body pl-12">
                    {q.description}
                  </div>
                )}

                {q.title.startsWith('Test Général') && (
                  <div className="mt-3 pl-12">
                    <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md bg-primary/10 text-primary font-semibold font-body">
                      <Layers className="w-3 h-3" /> Test général du stage
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
