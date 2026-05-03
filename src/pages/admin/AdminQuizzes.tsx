import React, { useState } from 'react';
import { getQuizzes, saveQuiz, deleteQuiz, getCourses, genId } from '@/lib/store';
import { Quiz, Question, Answer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, ClipboardList, X, Play, ChevronDown, ChevronUp, Check } from 'lucide-react';

const TIMER_OPTIONS = [5, 10, 15, 30, 60];

function QuestionEditor({ question, onChange, onDelete }: { question: Question; onChange: (q: Question) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(true);

  const addAnswer = () => {
    onChange({ ...question, answers: [...question.answers, { id: genId(), text: '', isCorrect: false }] });
  };

  const updateAnswer = (idx: number, updates: Partial<Answer>) => {
    const answers = [...question.answers];
    answers[idx] = { ...answers[idx], ...updates };
    if (question.type === 'single' && updates.isCorrect) {
      answers.forEach((a, i) => { if (i !== idx) a.isCorrect = false; });
    }
    onChange({ ...question, answers });
  };

  const removeAnswer = (idx: number) => {
    onChange({ ...question, answers: question.answers.filter((_, i) => i !== idx) });
  };

  return (
    <div className="border border-border rounded-xl p-4 bg-secondary/20">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <span className="w-6 h-6 rounded-lg gradient-muscle flex items-center justify-center text-[10px] font-bold text-primary-foreground">{question.order}</span>
        <span className="flex-1 text-[13px] font-medium truncate font-body text-foreground">{question.text || 'Nouvelle question'}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      {open && (
        <div className="mt-3 space-y-3">
          <Input placeholder="Texte de la question" value={question.text} onChange={e => onChange({ ...question, text: e.target.value })} className="bg-background border-border text-[13px] h-9" />
          <div className="flex gap-2 items-center flex-wrap">
            <select value={question.type} onChange={e => onChange({ ...question, type: e.target.value as 'single' | 'multiple' })} className="h-8 rounded-lg bg-background border border-border px-2.5 text-[11px] text-foreground font-body">
              <option value="single">Choix unique</option>
              <option value="multiple">Choix multiple</option>
            </select>
            <select value={question.timerSeconds} onChange={e => onChange({ ...question, timerSeconds: Number(e.target.value) })} className="h-8 rounded-lg bg-background border border-border px-2.5 text-[11px] text-foreground font-body">
              {TIMER_OPTIONS.map(t => <option key={t} value={t}>{t}s</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground font-body">Réponses</p>
            {question.answers.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2">
                <button onClick={() => updateAnswer(i, { isCorrect: !a.isCorrect })} className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${a.isCorrect ? 'bg-success/15 border-success text-success' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {a.isCorrect && <Check className="w-3 h-3" />}
                </button>
                <Input placeholder={`Réponse ${i + 1}`} value={a.text} onChange={e => updateAnswer(i, { text: e.target.value })} className="bg-background border-border flex-1 h-8 text-[12px]" />
                {question.answers.length > 2 && (
                  <button onClick={() => removeAnswer(i)} className="p-1 text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addAnswer} className="text-primary text-[11px] h-7"><Plus className="w-3 h-3 mr-1" /> Ajouter</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState(getQuizzes());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const courses = getCourses();

  const emptyQuiz: Partial<Quiz> = { title: '', description: '', courseId: courses[0]?.id || '', questions: [], status: 'draft', gradeBase: 20 };
  const [form, setForm] = useState<Partial<Quiz>>(emptyQuiz);

  const refresh = () => setQuizzes(getQuizzes());

  const addQuestion = () => {
    const questions = [...(form.questions || [])];
    questions.push({
      id: genId(), text: '', type: 'single',
      answers: [{ id: genId(), text: '', isCorrect: true }, { id: genId(), text: '', isCorrect: false }],
      timerSeconds: 30, order: questions.length + 1,
    });
    setForm({ ...form, questions });
  };

  const updateQuestion = (idx: number, q: Question) => {
    const questions = [...(form.questions || [])]; questions[idx] = q; setForm({ ...form, questions });
  };

  const deleteQuestion = (idx: number) => {
    const questions = (form.questions || []).filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i + 1 }));
    setForm({ ...form, questions });
  };

  const handleSave = () => {
    if (!form.title) return;
    const quiz: Quiz = {
      id: editing?.id || genId(), title: form.title || '', description: form.description || '',
      courseId: form.courseId || '', questions: form.questions || [],
      status: editing?.status || 'draft', createdAt: editing?.createdAt || new Date().toISOString(),
      lockOnStart: form.lockOnStart, autoSubmit: form.autoSubmit, gradeBase: form.gradeBase || 20,
    };
    saveQuiz(quiz); setShowForm(false); setEditing(null); setForm(emptyQuiz); refresh();
  };

  const startQuiz = (quiz: Quiz) => { saveQuiz({ ...quiz, status: 'active', startedAt: new Date().toISOString() }); refresh(); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Quiz & Examens</h1>
          <p className="text-[13px] text-muted-foreground mt-1 font-body">{quizzes.length} quiz</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyQuiz); }} className="gradient-muscle text-primary-foreground hover:opacity-90 rounded-xl h-9 text-[13px] shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Nouveau Quiz
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-card border border-primary/15 p-6 animate-slide-up shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[15px] font-semibold">{editing ? 'Modifier' : 'Nouveau Quiz'}</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <Input placeholder="Titre" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="bg-background border-border h-10 rounded-xl text-[13px]" />
            <select value={form.courseId || ''} onChange={e => setForm({ ...form, courseId: e.target.value })} className="h-10 rounded-xl bg-background border border-border px-3 text-[13px] text-foreground font-body">
              <option value="">-- Cours --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <textarea placeholder="Description" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full h-20 rounded-xl bg-background border border-border px-3 py-2 text-[13px] text-foreground resize-none font-body" />
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-body">Notation</label>
              <div className="flex gap-1.5">
                {[10, 20].map(b => (
                  <button key={b} onClick={() => setForm({ ...form, gradeBase: b })} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all font-body ${form.gradeBase === b ? 'gradient-muscle text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>/{b}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-semibold font-body text-foreground">Questions ({(form.questions || []).length})</h4>
              <Button variant="ghost" size="sm" onClick={addQuestion} className="text-primary text-[12px] h-7"><Plus className="w-3 h-3 mr-1" /> Ajouter</Button>
            </div>
            {(form.questions || []).map((q, i) => (
              <QuestionEditor key={q.id} question={q} onChange={q => updateQuestion(i, q)} onDelete={() => deleteQuestion(i)} />
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl text-[13px] h-9">Annuler</Button>
            <Button onClick={handleSave} className="gradient-muscle text-primary-foreground rounded-xl text-[13px] h-9">Enregistrer</Button>
          </div>
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-16 text-center shadow-card">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-[13px] font-body">Aucun quiz créé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map(q => {
            const course = courses.find(c => c.id === q.courseId);
            return (
              <div key={q.id} className="rounded-2xl bg-card border border-border p-5 hover:shadow-card-hover shadow-card transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl gradient-muscle flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display text-[14px] font-semibold text-foreground">{q.title}</h3>
                      <p className="text-[11px] text-muted-foreground font-body">{course?.title || '—'} • {q.questions.length} q. • /{q.gradeBase || 20}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-body ${
                      q.status === 'active'
                        ? 'bg-success/10 text-success'
                        : q.status === 'completed'
                          ? 'bg-info/10 text-info'
                          : q.status === 'published'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-secondary text-muted-foreground'
                    }`}>
                      {q.status === 'draft' ? 'Brouillon' : q.status === 'active' ? 'En cours' : q.status === 'published' ? 'Publié' : 'Terminé'}
                    </span>
                    {q.status !== 'active' && (
                      <Button size="sm" onClick={() => startQuiz(q)} className="gradient-muscle text-primary-foreground text-[11px] h-7 rounded-lg">
                        <Play className="w-3 h-3 mr-1" /> {q.status === 'completed' ? 'Relancer' : 'Lancer'}
                      </Button>
                    )}
                    <button onClick={() => { setEditing(q); setForm(q); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { deleteQuiz(q.id); refresh(); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
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

