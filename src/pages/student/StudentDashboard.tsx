import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCourses, getQuizzes, getStudentAttempts, getStages } from '@/lib/store';
import {
  BookOpen, ClipboardList, Trophy, Target,
  ArrowRight, TrendingUp, Zap, Heart, Activity, Layers
} from 'lucide-react';
import { convertToGrade } from '@/types';

const cardStyles = [
  { bg: 'gradient-card-blue', iconBg: 'bg-info/10', iconColor: 'text-info' },
  { bg: 'gradient-card-orange', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  { bg: 'gradient-card-green', iconBg: 'bg-success/10', iconColor: 'text-success' },
  { bg: 'gradient-card-purple', iconBg: 'bg-[hsl(270_60%_55%)]/10', iconColor: 'text-[hsl(270,60%,55%)]' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const allCourses = getCourses();
  const stages = getStages();
  const availableQuizzes = getQuizzes().filter(q => q.status === 'active' || q.status === 'published');
  const attempts = getStudentAttempts(user?.id || '');
  const completedAttempts = attempts.filter(a => a.status === 'completed' || a.status === 'submitted');
  const pendingQuizzes = availableQuizzes.filter(q => !completedAttempts.some(a => a.quizId === q.id));
  const avgPct = completedAttempts.length ? Math.round(completedAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / completedAttempts.length) : 0;
  const totalFiles = allCourses.reduce((s, c) => s + (c.files?.length || 0), 0);

  const stats = [
    { icon: Layers, label: 'Stages', value: stages.length, sub: `${allCourses.length} cours` },
    { icon: ClipboardList, label: 'Quiz à faire', value: pendingQuizzes.length, sub: `${availableQuizzes.length} dispo` },
    { icon: Trophy, label: 'Examens passés', value: completedAttempts.length },
    { icon: Target, label: 'Moyenne', value: convertToGrade(avgPct, 20), isGrade: true },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Bienvenue, <span className="text-muscle-gradient">{user?.fullName}</span>
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1 font-body">Votre espace de formation</p>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground/30">
          <Heart className="w-4 h-4" />
          <Activity className="w-4 h-4" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`group rounded-2xl p-5 transition-all duration-300 bg-card border border-border shadow-card hover:shadow-card-hover ${cardStyles[i].bg}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cardStyles[i].iconBg}`}>
                <s.icon className={`w-[18px] h-[18px] ${cardStyles[i].iconColor}`} />
              </div>
              {s.sub && <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-md font-body">{s.sub}</span>}
            </div>
            <p className={`text-2xl font-display font-bold ${s.isGrade ? 'text-muscle-gradient' : 'text-foreground'}`}>{s.value}</p>
            <p className="text-[12px] text-muted-foreground font-body">{s.label}</p>
          </div>
        ))}
      </div>

      {completedAttempts.length > 0 && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-card">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="font-display text-[15px] font-semibold text-foreground">Dernières notes</h3>
          </div>
          <div className="p-3 space-y-1">
            {completedAttempts.slice(-5).reverse().map(a => {
              const quiz = getQuizzes().find(q => q.id === a.quizId);
              const pct = a.percentage || 0;
              return (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pct >= 50 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                      <Trophy className={`w-4 h-4 ${pct >= 50 ? 'text-success' : 'text-destructive'}`} />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium font-body text-foreground">{quiz?.title || 'Quiz'}</p>
                      <p className="text-[11px] text-muted-foreground font-body">{a.completedAt ? new Date(a.completedAt).toLocaleDateString('fr-FR') : '-'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[13px] font-bold ${pct >= 50 ? 'text-success' : 'text-destructive'}`}>{pct}%</p>
                    <p className="text-[11px] text-muscle-gradient font-semibold font-body">{convertToGrade(pct, quiz?.gradeBase || 20)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {availableQuizzes.length > 0 && (
        <div className="rounded-2xl bg-card border border-primary/15 overflow-hidden shadow-card gradient-card-orange">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-primary/10">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="font-display text-[15px] font-semibold text-foreground">Quiz disponibles</h3>
          </div>
          <div className="p-3 space-y-1">
            {availableQuizzes.map(q => (
              <div key={q.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 transition-colors">
                <div>
                  <p className="text-[13px] font-medium font-body text-foreground">{q.title}</p>
                  <p className="text-[11px] text-muted-foreground font-body">
                    {q.questions?.length || 0} questions • {completedAttempts.some(a => a.quizId === q.id) ? 'Terminé' : q.status === 'active' ? 'En cours' : 'Non commencé'}
                  </p>
                </div>
                <a href={`/student/quizzes/${q.id}`}
                  className="px-4 py-2 rounded-xl gradient-muscle text-primary-foreground text-[12px] font-semibold hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5">
                  {completedAttempts.some(a => a.quizId === q.id) ? 'Voir' : 'Commencer'} <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

