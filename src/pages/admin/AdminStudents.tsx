import React, { useState } from 'react';
import { getStudents, saveUser, deleteUser, genId, getAttempts, getQuizzes, getStages, getCoursesByStage } from '@/lib/store';
import { User, convertToGrade } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus, Pencil, Trash2, Users, X, Ban, CheckCircle2,
  GraduationCap, ChevronDown, ChevronRight, BookOpen, Award,
  ClipboardList, ArrowLeft
} from 'lucide-react';

type MainTab = 'list' | 'notes';

/* --- Notes detail for one student --- */
function StudentNotesDetail({ student, onClose }: { student: User; onClose: () => void }) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const attempts = getAttempts().filter(a => a.studentId === student.id && (a.status === 'completed' || a.status === 'submitted'));
  const quizzes = getQuizzes();
  const stages = getStages();

  const stageData = stages.map(stage => {
    const stageCourses = getCoursesByStage(stage.id);
    const stageQuizzes = quizzes.filter(q => q.stageId === stage.id);
    const stageAttempts = attempts.filter(a => stageQuizzes.some(q => q.id === a.quizId));
    const avg = stageAttempts.length ? Math.round(stageAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / stageAttempts.length) : null;

    // Group by course
    const courseResults = stageCourses.map(course => {
      const courseQuizzes = stageQuizzes.filter(q => q.courseId === course.id);
      const courseAttempts = stageAttempts.filter(a => courseQuizzes.some(q => q.id === a.quizId));
      return {
        course,
        attempts: courseAttempts.map(att => {
          const quiz = quizzes.find(q => q.id === att.quizId);
          return { ...att, quizTitle: quiz?.title || 'Examen', gradeBase: quiz?.gradeBase || 20 };
        }),
        avg: courseAttempts.length ? Math.round(courseAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / courseAttempts.length) : null,
      };
    }).filter(cr => cr.attempts.length > 0);

    return { stage, avg, count: stageAttempts.length, courseResults };
  });

  const overallAvg = attempts.length ? Math.round(attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempts.length) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back bar */}
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground font-body transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-muscle flex items-center justify-center text-sm font-bold text-primary-foreground shadow-sm">
            {student.fullName.charAt(0)}
          </div>
          <div>
            <h3 className="text-[15px] font-display font-bold text-foreground">{student.fullName}</h3>
            <p className="text-[11px] text-muted-foreground font-body">{student.username} • {student.promotion || '—'} • {student.section === '2eme_section' ? '2ème Section' : '1ère Section'}</p>
          </div>
        </div>
        <div className="ml-auto px-4 py-2 rounded-xl bg-primary/8 border border-primary/15">
          <span className="text-[11px] text-muted-foreground font-body">Note Générale</span>
          <span className="ml-2 text-[15px] font-bold text-primary font-display">{convertToGrade(overallAvg, 20)}</span>
        </div>
      </div>

      {/* Stages */}
      {stageData.map(sd => (
        <div key={sd.stage.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <button
            onClick={() => setExpandedStage(expandedStage === sd.stage.id ? null : sd.stage.id)}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[14px] font-display font-bold text-foreground">{sd.stage.name} <span className="text-muted-foreground font-normal">({sd.stage.code})</span></p>
              <p className="text-[11px] text-muted-foreground font-body">{sd.count} examen(s) passé(s)</p>
            </div>
            <div className="text-right mr-3">
              {sd.avg !== null ? (
                <span className={`text-[15px] font-bold font-display ${sd.avg >= 50 ? 'text-success' : 'text-destructive'}`}>{convertToGrade(sd.avg, 20)}</span>
              ) : (
                <span className="text-[12px] text-muted-foreground">—</span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${expandedStage === sd.stage.id ? 'rotate-180' : ''}`} />
          </button>

          {expandedStage === sd.stage.id && (
            <div className="border-t border-border animate-fade-in">
              {sd.courseResults.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-[12px] text-muted-foreground font-body">Aucun examen passé dans ce stage</p>
                </div>
              ) : (
                sd.courseResults.map(cr => (
                  <div key={cr.course.id} className="border-b border-border/50 last:border-0">
                    <div className="px-5 py-3 bg-secondary/20 flex items-center gap-2">
                      <ClipboardList className="w-3.5 h-3.5 text-primary/60" />
                      <span className="text-[12px] font-semibold font-body text-foreground">{cr.course.title}</span>
                      {cr.avg !== null && (
                        <span className={`ml-auto text-[12px] font-bold ${cr.avg >= 50 ? 'text-success' : 'text-destructive'}`}>{convertToGrade(cr.avg, 20)}</span>
                      )}
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="bg-secondary/10">
                          <th className="text-left px-5 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Examen</th>
                          <th className="text-center px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Score</th>
                          <th className="text-center px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Note</th>
                          <th className="text-center px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-body">%</th>
                          <th className="text-right px-5 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cr.attempts.map(att => (
                          <tr key={att.id} className="border-t border-border/30 hover:bg-secondary/10 transition-colors">
                            <td className="px-5 py-2.5 text-[12px] font-medium font-body text-foreground">{att.quizTitle}</td>
                            <td className="px-3 py-2.5 text-center text-[12px] font-body">
                              <span className="text-primary font-semibold">{att.correctAnswers || 0}</span>
                              <span className="text-muted-foreground">/{att.totalQuestions || 0}</span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`text-[12px] font-bold ${(att.percentage || 0) >= 50 ? 'text-success' : 'text-destructive'}`}>
                                {convertToGrade(att.percentage || 0, att.gradeBase)}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${(att.percentage || 0) >= 50 ? 'bg-success' : 'bg-destructive'}`} style={{ width: `${att.percentage || 0}%` }} />
                                </div>
                                <span className="text-[11px] font-semibold font-body">{att.percentage || 0}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-2.5 text-right text-[11px] text-muted-foreground font-body">
                              {att.completedAt ? new Date(att.completedAt).toLocaleString('fr-FR') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* --- Notes overview table --- */
function NotesTable({ onViewStudent }: { onViewStudent: (s: User) => void }) {
  const students = getStudents();
  const attempts = getAttempts().filter(a => a.status === 'completed' || a.status === 'submitted');
  const quizzes = getQuizzes();
  const stages = getStages();

  const rows = students.map(student => {
    const studentAttempts = attempts.filter(a => a.studentId === student.id);
    const overallAvg = studentAttempts.length ? Math.round(studentAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / studentAttempts.length) : null;

    const stageAvgs: Record<string, number | null> = {};
    stages.forEach(stage => {
      const stageQuizzes = quizzes.filter(q => q.stageId === stage.id);
      const stageAttempts = studentAttempts.filter(a => stageQuizzes.some(q => q.id === a.quizId));
      stageAvgs[stage.id] = stageAttempts.length ? Math.round(stageAttempts.reduce((s, a) => s + (a.percentage || 0), 0) / stageAttempts.length) : null;
    });

    return { student, overallAvg, stageAvgs };
  });

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-elevated">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-secondary/30">
            <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Nom Complet</th>
            <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Matricule</th>
            <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Promotion</th>
            <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Section</th>
            {stages.map(s => (
              <th key={s.id} className="text-center px-3 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">{s.code}</th>
            ))}
            <th className="text-center px-4 py-3.5 text-[11px] font-semibold text-primary uppercase tracking-wider font-body bg-primary/5">Générale</th>
            <th className="text-right px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ student, overallAvg, stageAvgs }) => (
            <tr key={student.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg gradient-muscle flex items-center justify-center text-[11px] font-bold text-primary-foreground shadow-sm">
                    {student.fullName.charAt(0)}
                  </div>
                  <span className="text-[13px] font-semibold font-body text-foreground">{student.fullName}</span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-[13px] text-muted-foreground font-body font-medium">{student.username}</td>
              <td className="px-4 py-3.5 text-[12px] text-muted-foreground font-body">{student.promotion || '—'}</td>
              <td className="px-4 py-3.5">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/8 text-primary font-semibold font-body">
                  {student.section === '2eme_section' ? '2ème' : '1ère'}
                </span>
              </td>
              {stages.map(stage => (
                <td key={stage.id} className="px-3 py-3.5 text-center">
                  {stageAvgs[stage.id] !== null ? (
                    <span className={`text-[12px] font-bold ${stageAvgs[stage.id]! >= 50 ? 'text-success' : 'text-destructive'}`}>
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
                <button onClick={() => onViewStudent(student)}
                  className="text-[11px] font-semibold text-primary hover:text-primary/80 font-body flex items-center gap-1 ml-auto transition-colors">
                  Voir les notes <ChevronRight className="w-3.5 h-3.5" />
                </button>
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

/* --- Main component --- */
export default function AdminStudents() {
  const [students, setStudents] = useState(getStudents());
  const [activeTab, setActiveTab] = useState<MainTab>('list');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [notesStudent, setNotesStudent] = useState<User | null>(null);
  const [form, setForm] = useState({ fullName: '', username: '', password: '', promotion: '', section: '1ere_section' as string });

  const refresh = () => setStudents(getStudents());

  const handleSave = () => {
    const fullName = form.fullName.trim();
    const username = form.username.trim().toUpperCase();
    if (!fullName || !username) return;
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
  };

  const toggleDisable = (s: User) => { saveUser({ ...s, disabled: !s.disabled }); refresh(); };

  // If viewing a student's full notes detail
  if (notesStudent) {
    return (
      <div className="space-y-6 animate-fade-in">
        <StudentNotesDetail student={notesStudent} onClose={() => setNotesStudent(null)} />
      </div>
    );
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
        {activeTab === 'list' && (
          <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ fullName: '', username: '', password: '', promotion: '', section: '1ere_section' }); }}
            className="gradient-muscle text-primary-foreground hover:opacity-90 rounded-xl h-10 text-[13px] shadow-sm gap-2 px-5">
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        )}
      </div>

      {/* Tab switch */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 border border-border w-fit">
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

      {/* NOTES TAB */}
      {activeTab === 'notes' && (
        <NotesTable onViewStudent={s => setNotesStudent(s)} />
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

          {students.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-16 text-center shadow-card">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-[13px] font-body">Aucun stagiaire enregistré</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-elevated">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Stagiaire</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Matricule</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Section</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Promotion</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Statut</th>
                    <th className="text-right px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-body">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg gradient-muscle flex items-center justify-center text-[11px] font-bold text-primary-foreground shadow-sm">
                            {s.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold font-body text-foreground">{s.fullName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-muted-foreground font-body font-medium">{s.username}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-primary/8 text-primary font-semibold font-body">
                          {s.section === '2eme_section' ? '2ème' : '1ère'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-muted-foreground font-body">{s.promotion || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold font-body ${
                          s.disabled ? 'bg-destructive/8 text-destructive' : 'bg-success/8 text-success'
                        }`}>
                          {s.disabled ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {s.disabled ? 'Désactivé' : 'Actif'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setEditing(s); setForm({ fullName: s.fullName, username: s.username, password: '', promotion: s.promotion || '', section: s.section || '1ere_section' }); setShowForm(true); }}
                            title="Modifier" className="p-2 rounded-lg hover:bg-primary/8 text-muted-foreground hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => toggleDisable(s)} title={s.disabled ? 'Activer' : 'Désactiver'}
                            className="p-2 rounded-lg hover:bg-warning/8 text-muted-foreground hover:text-warning transition-colors"><Ban className="w-4 h-4" /></button>
                          <button onClick={() => { deleteUser(s.id); refresh(); }} title="Supprimer"
                            className="p-2 rounded-lg hover:bg-destructive/8 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}


