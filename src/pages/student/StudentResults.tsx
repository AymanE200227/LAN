import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentAttempts, getQuizzes } from '@/lib/store';
import { BarChart3, Trophy } from 'lucide-react';
import { convertToGrade } from '@/types';

export default function StudentResults() {
  const { user } = useAuth();
  const attempts = getStudentAttempts(user?.id || '').filter(a => a.status === 'completed' || a.status === 'submitted');
  const quizzes = getQuizzes();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Mes Résultats</h1>
        <p className="text-[13px] text-muted-foreground mt-1 font-body">Historique de vos examens</p>
      </div>

      {attempts.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-16 text-center shadow-card">
          <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-[13px] font-body">Aucun résultat</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map(a => {
            const quiz = quizzes.find(q => q.id === a.quizId);
            const gradeBase = quiz?.gradeBase || 20;
            const grade = convertToGrade(a.percentage || 0, gradeBase);
            return (
              <div key={a.id} className="rounded-2xl bg-card border border-border p-5 shadow-card hover:shadow-card-hover transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(a.percentage || 0) >= 50 ? 'gradient-muscle' : 'bg-destructive/10'}`}>
                      <Trophy className={`w-5 h-5 ${(a.percentage || 0) >= 50 ? 'text-primary-foreground' : 'text-destructive'}`} />
                    </div>
                    <div>
                      <h3 className="font-display text-[14px] font-semibold text-foreground">{quiz?.title || 'Quiz'}</h3>
                      <p className="text-[11px] text-muted-foreground font-body">{a.completedAt ? new Date(a.completedAt).toLocaleString('fr-FR') : '-'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-display font-bold text-primary">{a.percentage}%</p>
                    <p className="text-[12px] font-semibold text-muscle-gradient font-body">{grade}</p>
                    <p className="text-[11px] text-muted-foreground font-body">{a.correctAnswers}/{a.totalQuestions}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

