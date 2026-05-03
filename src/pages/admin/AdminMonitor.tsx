import React from 'react';
import { getQuizzes, getStudents, getQuizAttempts } from '@/lib/store';
import { Monitor, Wifi, WifiOff, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminMonitor() {
  const quizzes = getQuizzes().filter(q => q.status === 'active');
  const students = getStudents();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Surveillance</h1>
        <p className="text-[13px] text-muted-foreground mt-1 font-body">Suivi en temps réel des examens</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-16 text-center shadow-card">
          <Monitor className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-[13px] font-body">Aucun examen en cours</p>
          <p className="text-[11px] text-muted-foreground mt-1 font-body">Lancez un quiz depuis Quiz & Examens</p>
        </div>
      ) : (
        quizzes.map(quiz => {
          const attempts = getQuizAttempts(quiz.id);
          return (
            <div key={quiz.id} className="rounded-2xl bg-card border border-primary/15 p-5 space-y-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-muscle flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-[14px] font-semibold text-foreground">{quiz.title}</h3>
                  <p className="text-[11px] text-muted-foreground font-body">{quiz.questions.length} questions • {quiz.startedAt ? new Date(quiz.startedAt).toLocaleTimeString('fr-FR') : ''}</p>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-success/10 text-success animate-pulse-muscle font-body">En direct</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {students.map(s => {
                  const attempt = attempts.find(a => a.studentId === s.id);
                  const status = attempt?.status || 'waiting';
                  const StatusIcon = status === 'completed' ? CheckCircle2 : status === 'in_progress' ? Clock : status === 'waiting' ? WifiOff : AlertCircle;
                  const color = status === 'completed' ? 'text-success' : status === 'in_progress' ? 'text-primary' : 'text-muted-foreground';

                  return (
                    <div key={s.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors">
                      <div className="w-7 h-7 rounded-lg gradient-muscle flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                        {s.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium truncate font-body text-foreground">{s.fullName}</p>
                        <div className="flex items-center gap-1">
                          <StatusIcon className={`w-3 h-3 ${color}`} />
                          <span className={`text-[10px] ${color} font-body`}>
                            {status === 'waiting' ? 'Attente' : status === 'in_progress' ? `Q${attempt?.currentQuestion || 1}/${quiz.questions.length}` : status === 'completed' ? 'Terminé' : 'Déco.'}
                          </span>
                        </div>
                      </div>
                      {attempt?.status === 'in_progress' && (
                        <div className="w-12">
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full gradient-muscle rounded-full transition-all" style={{ width: `${((attempt.currentQuestion || 0) / quiz.questions.length) * 100}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

