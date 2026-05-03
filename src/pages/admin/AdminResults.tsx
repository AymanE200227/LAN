import React, { useState } from 'react';
import { getAttempts, getQuizzes, getStudents } from '@/lib/store';
import { BarChart3, Printer, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { convertToGrade, Quiz } from '@/types';

function PrintExamView({ attemptId, onClose }: { attemptId: string | null; onClose: () => void }) {
  if (!attemptId) return null;
  const attempts = getAttempts();
  const quizzes = getQuizzes();
  const students = getStudents();
  const attempt = attempts.find(a => a.id === attemptId);
  if (!attempt) return null;
  const quiz = quizzes.find(q => q.id === attempt.quizId);
  const student = students.find(s => s.id === attempt.studentId);
  const gradeBase = quiz?.gradeBase || 20;
  const grade = convertToGrade(attempt.percentage || 0, gradeBase);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 overflow-auto">
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h2 className="font-display text-lg font-bold text-foreground">Aperçu Impression</h2>
          <div className="flex gap-2">
            <Button onClick={() => window.print()} className="gradient-muscle text-primary-foreground h-9 text-[13px] rounded-xl"><Printer className="w-4 h-4 mr-1.5" /> Imprimer</Button>
            <Button variant="ghost" onClick={onClose} className="h-9 text-[13px] rounded-xl">Fermer</Button>
          </div>
        </div>
        <div className="bg-white text-black p-8 rounded-xl shadow-elevated" id="print-area">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold">Centre Sportif FAR</h1>
            <h2 className="text-lg font-semibold mt-1">Fiche de Résultat</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div><strong>Étudiant :</strong> {student?.fullName || '?'}</div>
            <div><strong>Examen :</strong> {quiz?.title || '-'}</div>
            <div><strong>Date :</strong> {attempt.completedAt ? new Date(attempt.completedAt).toLocaleString('fr-FR') : '-'}</div>
            <div><strong>Note :</strong> <span className="text-lg font-bold">{grade}</span> ({attempt.percentage}%)</div>
          </div>
          <table className="w-full border-collapse text-sm mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left">N°</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Question</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Réponses</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Résultat</th>
              </tr>
            </thead>
            <tbody>
              {quiz?.questions.map((q, i) => {
                const selected = attempt.answers[q.id] || [];
                const correctIds = q.answers.filter(a => a.isCorrect).map(a => a.id);
                const isCorrect = correctIds.length === selected.length && correctIds.every(id => selected.includes(id));
                return (
                  <tr key={q.id}>
                    <td className="border border-gray-300 px-3 py-2">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2">{q.text}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {q.answers.map(a => (
                        <div key={a.id} className={`${selected.includes(a.id) ? 'font-bold' : ''} ${a.isCorrect ? 'text-green-700' : ''}`}>
                          {selected.includes(a.id) ? '✓ ' : '○ '}{a.text}
                        </div>
                      ))}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center font-bold">{isCorrect ? '✓' : '✗'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t-2 border-black pt-4 flex justify-between">
            <div><strong>Score :</strong> {attempt.correctAnswers}/{attempt.totalQuestions}</div>
            <div><strong>% :</strong> {attempt.percentage}%</div>
            <div><strong>Note :</strong> {grade}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminResults() {
  const attempts = getAttempts().filter(a => a.status === 'completed' || a.status === 'submitted');
  const quizzes = getQuizzes();
  const students = getStudents();
  const [printAttempt, setPrintAttempt] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  const filteredAttempts = selectedStudent ? attempts.filter(a => a.studentId === selectedStudent) : attempts;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Résultats</h1>
          <p className="text-[13px] text-muted-foreground mt-1 font-body">{attempts.length} résultats</p>
        </div>
        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="h-9 rounded-xl bg-card border border-border px-3 text-[13px] text-foreground font-body shadow-sm">
          <option value="">Tous</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </select>
      </div>

      {selectedStudent && (() => {
        const student = students.find(s => s.id === selectedStudent);
        const sa = attempts.filter(a => a.studentId === selectedStudent);
        const avg = sa.length ? Math.round(sa.reduce((s, a) => s + (a.percentage || 0), 0) / sa.length) : 0;
        return (
          <div className="rounded-2xl bg-card border border-primary/15 p-5 flex items-center gap-5 shadow-card gradient-card-orange">
            <div className="w-11 h-11 rounded-xl gradient-muscle flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 grid grid-cols-4 gap-3">
              <div><p className="text-[11px] text-muted-foreground font-body">Étudiant</p><p className="text-[13px] font-semibold font-body text-foreground">{student?.fullName}</p></div>
              <div><p className="text-[11px] text-muted-foreground font-body">Examens</p><p className="text-[13px] font-semibold font-body text-foreground">{sa.length}</p></div>
              <div><p className="text-[11px] text-muted-foreground font-body">Moyenne</p><p className="text-[13px] font-semibold text-primary font-body">{avg}% • {convertToGrade(avg, 20)}</p></div>
              <div><p className="text-[11px] text-muted-foreground font-body">Dernière</p><p className="text-[13px] font-semibold font-body text-foreground">{sa[sa.length - 1]?.percentage || '-'}%</p></div>
            </div>
          </div>
        );
      })()}

      {filteredAttempts.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-16 text-center shadow-card">
          <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-[13px] font-body">Aucun résultat</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {['Étudiant', 'Quiz', 'Score', 'Note', '%', 'Date', ''].map(h => (
                  <th key={h} className={`${h === '' ? 'text-right' : 'text-left'} px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAttempts.map(a => {
                const student = students.find(s => s.id === a.studentId);
                const quiz = quizzes.find(q => q.id === a.quizId);
                const grade = convertToGrade(a.percentage || 0, quiz?.gradeBase || 20);
                return (
                  <tr key={a.id} className="border-b border-border/60 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg gradient-muscle flex items-center justify-center text-[10px] font-bold text-primary-foreground">{student?.fullName?.charAt(0) || '?'}</div>
                        <span className="text-[13px] font-medium font-body text-foreground">{student?.fullName || '?'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-muted-foreground font-body">{quiz?.title || '-'}</td>
                    <td className="px-5 py-3 text-[13px] font-body"><span className="text-primary font-semibold">{a.correctAnswers || 0}</span><span className="text-muted-foreground">/{a.totalQuestions || 0}</span></td>
                    <td className="px-5 py-3 text-[13px] font-semibold text-muscle-gradient font-body">{grade}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden"><div className="h-full gradient-muscle rounded-full" style={{ width: `${a.percentage || 0}%` }} /></div>
                        <span className="text-[12px] font-medium text-primary font-body">{a.percentage || 0}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-muted-foreground font-body">{a.completedAt ? new Date(a.completedAt).toLocaleString('fr-FR') : '-'}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setPrintAttempt(a.id)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary"><Printer className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PrintExamView attemptId={printAttempt} onClose={() => setPrintAttempt(null)} />
    </div>
  );
}

