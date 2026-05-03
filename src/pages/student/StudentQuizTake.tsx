import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizzes, saveAttempt, genId } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { QuizAttempt, convertToGrade } from '@/types';
import { Button } from '@/components/ui/button';
import { Clock, ChevronRight, Send, CheckCircle2 } from 'lucide-react';

function QuizTimer({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = (timeLeft / total) * 100;
  const isUrgent = timeLeft <= 5;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${isUrgent ? 'animate-pulse-muscle' : ''}`}>
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" stroke="hsl(var(--secondary))" strokeWidth="3" fill="none" />
          <circle cx="32" cy="32" r="28" stroke={isUrgent ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} strokeWidth="3" fill="none" strokeDasharray={`${2 * Math.PI * 28}`} strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <span className={`absolute text-lg font-mono font-bold ${isUrgent ? 'text-destructive' : 'text-primary'}`}>{timeLeft}</span>
      </div>
      <span className="text-[10px] text-muted-foreground font-body">secondes</span>
    </div>
  );
}

function QuizResultScreen({ quiz, answers, navigate }: { quiz: any; answers: Record<string, string[]>; navigate: any }) {
  let correct = 0;
  quiz.questions.forEach((q: any) => {
    const selected = answers[q.id] || [];
    const correctIds = q.answers.filter((a: any) => a.isCorrect).map((a: any) => a.id);
    if (correctIds.length === selected.length && correctIds.every((id: string) => selected.includes(id))) correct++;
  });
  const pct = Math.round((correct / quiz.questions.length) * 100);
  const grade = convertToGrade(pct, quiz.gradeBase || 20);

  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-6 animate-slide-up">
      <div className="w-16 h-16 rounded-2xl gradient-muscle flex items-center justify-center mx-auto shadow-lg shadow-primary/15">
        <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
      </div>
      <h2 className="text-2xl font-display font-bold text-foreground">Examen Terminé</h2>
      <div className="rounded-2xl bg-card border border-primary/15 p-8 shadow-card">
        <p className="text-4xl font-display font-bold text-primary mb-1">{pct}%</p>
        <p className="text-xl font-display font-semibold text-muscle-gradient mb-2">{grade}</p>
        <p className="text-[13px] text-muted-foreground font-body">{correct} / {quiz.questions.length} correctes</p>
      </div>
      <div className="flex gap-2 justify-center">
        <Button onClick={() => navigate('/student/results')} className="gradient-muscle text-primary-foreground rounded-xl h-9 text-[13px]">Résultats</Button>
        <Button variant="ghost" onClick={() => navigate('/student/quizzes')} className="rounded-xl h-9 text-[13px]">Retour</Button>
      </div>
    </div>
  );
}

export default function StudentQuizTake() {
  const { quizId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const quiz = getQuizzes().find(q => q.id === quizId);

  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = quiz?.questions[currentQ];

  const finishQuiz = useCallback(() => {
    if (!quiz || !user) return;
    let correct = 0;
    quiz.questions.forEach(q => {
      const selected = answers[q.id] || [];
      const correctIds = q.answers.filter(a => a.isCorrect).map(a => a.id);
      if (correctIds.length === selected.length && correctIds.every(id => selected.includes(id))) correct++;
    });
    const attempt: QuizAttempt = {
      id: genId(), quizId: quiz.id, studentId: user.id, answers,
      currentQuestion: quiz.questions.length, status: 'completed',
      startedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
      score: correct, totalQuestions: quiz.questions.length,
      correctAnswers: correct, percentage: Math.round((correct / quiz.questions.length) * 100),
    };
    saveAttempt(attempt);
    setFinished(true);
  }, [quiz, user, answers]);

  useEffect(() => {
    if (!started || finished || !question) return;
    setTimeLeft(question.timerSeconds);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (currentQ < (quiz?.questions.length || 0) - 1) setCurrentQ(c => c + 1);
          else finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, currentQ, finished, question, quiz, finishQuiz]);

  if (!quiz) return <div className="text-center py-20 text-muted-foreground font-body">Quiz introuvable</div>;

  const toggleAnswer = (answerId: string) => {
    if (!question) return;
    const current = answers[question.id] || [];
    if (question.type === 'single') {
      setAnswers({ ...answers, [question.id]: [answerId] });
    } else {
      setAnswers({ ...answers, [question.id]: current.includes(answerId) ? current.filter(id => id !== answerId) : [...current, answerId] });
    }
  };

  const nextQuestion = () => {
    if (currentQ < quiz.questions.length - 1) setCurrentQ(currentQ + 1);
    else finishQuiz();
  };

  if (finished) return <QuizResultScreen quiz={quiz} answers={answers} navigate={navigate} />;

  if (!started) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="w-14 h-14 rounded-2xl gradient-muscle flex items-center justify-center mx-auto shadow-lg shadow-primary/15">
          <Clock className="w-7 h-7 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">{quiz.title}</h2>
        <p className="text-[13px] text-muted-foreground font-body">{quiz.questions.length} questions • Chronométré</p>
        <p className="text-[12px] text-muted-foreground font-body">{quiz.description}</p>
        <Button onClick={() => setStarted(true)} className="gradient-muscle text-primary-foreground text-[14px] px-8 py-2.5 h-auto hover:opacity-90 rounded-xl shadow-lg shadow-primary/15">
          Commencer
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-muted-foreground font-body">Question {currentQ + 1} / {quiz.questions.length}</span>
        <QuizTimer timeLeft={timeLeft} total={question?.timerSeconds || 30} />
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full gradient-muscle rounded-full transition-all duration-300" style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }} />
      </div>

      {question && (
        <div className="rounded-2xl bg-card border border-border p-6 animate-slide-up shadow-card">
          <h3 className="text-lg font-display font-semibold mb-5 text-foreground">{question.text}</h3>
          <div className="space-y-2.5">
            {question.answers.map((a, i) => {
              const selected = (answers[question.id] || []).includes(a.id);
              return (
                <button key={a.id} onClick={() => toggleAnswer(a.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30 hover:bg-secondary/30'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold ${selected ? 'gradient-muscle text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-[13px] font-medium font-body text-foreground">{a.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={nextQuestion} className="text-muted-foreground rounded-xl text-[13px]">
          Passer <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
        <Button onClick={nextQuestion} className="gradient-muscle text-primary-foreground hover:opacity-90 rounded-xl text-[13px] shadow-sm">
          {currentQ === quiz.questions.length - 1 ? <><Send className="w-3.5 h-3.5 mr-1.5" /> Soumettre</> : <>Suivant <ChevronRight className="w-3.5 h-3.5 ml-1" /></>}
        </Button>
      </div>
    </div>
  );
}

