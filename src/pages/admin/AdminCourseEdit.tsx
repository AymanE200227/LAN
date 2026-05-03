import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourses, saveCourse, getQuizzes, saveQuiz, deleteQuiz, genId } from '@/lib/store';
import { Course, CourseFile, Quiz, Question, Answer } from '@/types';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Upload, Trash2, FileText, Video, File, Image, X,
  FolderOpen, Download, Play, Search, ClipboardList, Plus, Pencil,
  ChevronDown, ChevronUp, Check
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText, doc: FileText, video: Video, image: Image, ppt: FileText, attachment: File,
};

const FILE_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  pdf: { bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  doc: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  video: { bg: 'bg-violet-50', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
  image: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  ppt: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  attachment: { bg: 'bg-slate-50', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700' },
};

function getFileType(file: globalThis.File): CourseFile['type'] {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['ppt', 'pptx'].includes(ext)) return 'ppt';
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  return 'attachment';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// In-memory blob store (survives within session, not persisted — localStorage can't hold big files)
const blobStore = new Map<string, string>();

export default function AdminCourseEdit() {
  const { courseId, stageId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(() => getCourses().find(c => c.id === courseId) || null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [courseQuizzes, setCourseQuizzes] = useState<Quiz[]>(() => getQuizzes().filter(q => q.courseId === courseId));
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const emptyQuiz: Partial<Quiz> = { title: '', description: '', courseId: courseId || '', questions: [], status: 'draft', gradeBase: 20 };
  const [quizForm, setQuizForm] = useState<Partial<Quiz>>(emptyQuiz);

  const refreshQuizzes = () => setCourseQuizzes(getQuizzes().filter(q => q.courseId === courseId));

  const addQuestion = () => {
    const questions = [...(quizForm.questions || [])];
    questions.push({
      id: genId(), text: '', type: 'single',
      answers: [{ id: genId(), text: '', isCorrect: true }, { id: genId(), text: '', isCorrect: false }],
      timerSeconds: 30, order: questions.length + 1,
    });
    setQuizForm({ ...quizForm, questions });
  };

  const updateQuestion = (idx: number, q: Question) => {
    const questions = [...(quizForm.questions || [])]; questions[idx] = q; setQuizForm({ ...quizForm, questions });
  };

  const deleteQuestion = (idx: number) => {
    const questions = (quizForm.questions || []).filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i + 1 }));
    setQuizForm({ ...quizForm, questions });
  };

  const handleQuizSave = () => {
    if (!quizForm.title) { toast.error('Le titre est requis'); return; }
    const quiz: Quiz = {
      id: editingQuiz?.id || genId(),
      title: quizForm.title || '',
      description: quizForm.description || '',
      courseId: courseId || '',
      stageId: stageId,
      questions: quizForm.questions || [],
      status: editingQuiz?.status || 'draft',
      createdAt: editingQuiz?.createdAt || new Date().toISOString(),
      gradeBase: quizForm.gradeBase || 20,
    };
    saveQuiz(quiz);
    setShowQuizForm(false);
    setEditingQuiz(null);
    setQuizForm(emptyQuiz);
    refreshQuizzes();
    toast.success(editingQuiz ? 'Quiz mis à jour' : 'Quiz créé');
  };

  const handleDeleteQuiz = (quizId: string) => {
    deleteQuiz(quizId);
    refreshQuizzes();
    toast.success('Quiz supprimé');
  };

  const handleStartQuiz = (quiz: Quiz) => {
    saveQuiz({ ...quiz, status: 'active', startedAt: new Date().toISOString() });
    refreshQuizzes();
    toast.success('Quiz lancé');
  };

  const backPath = stageId ? `/admin/stages/${stageId}` : '/admin/stages';

  if (!course) {
    return (
      <div className="text-center py-20">
        <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-[14px] text-muted-foreground font-body">Cours introuvable</p>
        <Button variant="ghost" onClick={() => navigate(backPath)} className="mt-4 rounded-xl text-[13px]">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour
        </Button>
      </div>
    );
  }

  const handleFileUpload = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: CourseFile[] = [];

    Array.from(fileList).forEach(file => {
      // Create object URL for preview (in-memory, no localStorage)
      const objectUrl = URL.createObjectURL(file);
      const fileId = genId();
      blobStore.set(fileId, objectUrl);

      newFiles.push({
        id: fileId,
        name: file.name,
        type: getFileType(file),
        url: objectUrl, // blob URL, not base64
        size: file.size,
      });
    });

    // Save metadata only (url will be blob: which is small)
    const updated = {
      ...course,
      files: [...(course.files || []), ...newFiles.map(f => ({ ...f, url: '' }))], // Don't save blob URLs to localStorage
    };
    setCourse({ ...course, files: [...(course.files || []), ...newFiles] }); // Keep blob URLs in state for preview
    saveCourse(updated); // Save without URLs to localStorage
    toast.success(`${newFiles.length} fichier(s) ajouté(s)`);
  };

  const deleteFile = (fileId: string) => {
    // Revoke blob URL
    const blobUrl = blobStore.get(fileId);
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobStore.delete(fileId); }

    const updated = { ...course, files: (course.files || []).filter(f => f.id !== fileId) };
    setCourse(updated);
    saveCourse(updated);
    toast.success('Fichier supprimé');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const files = course.files || [];
  const fileTypes = ['all', ...new Set(files.map(f => f.type))];
  const filteredFiles = files.filter(f => {
    if (filter !== 'all' && f.type !== filter) return false;
    if (search.trim() && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    pdf: files.filter(f => f.type === 'pdf').length,
    doc: files.filter(f => f.type === 'doc').length,
    video: files.filter(f => f.type === 'video').length,
    image: files.filter(f => f.type === 'image').length,
    other: files.filter(f => !['pdf', 'doc', 'video', 'image'].includes(f.type)).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(backPath)} className="rounded-xl text-[13px] h-9 px-3">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            {course.title}
          </h1>
          <p className="text-[12px] text-muted-foreground font-body mt-0.5">{course.description || 'Pas de description'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'PDF', count: stats.pdf, icon: FileText, color: FILE_COLORS.pdf },
          { label: 'Word', count: stats.doc, icon: FileText, color: FILE_COLORS.doc },
          { label: 'Vidéos', count: stats.video, icon: Video, color: FILE_COLORS.video },
          { label: 'Images', count: stats.image, icon: Image, color: FILE_COLORS.image },
          { label: 'Autres', count: stats.other, icon: File, color: FILE_COLORS.attachment },
        ].map(s => (
          <div key={s.label} className={`rounded-xl ${s.color.bg} border border-border/40 p-3 text-center transition-all hover:shadow-sm`}>
            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color.text}`} />
            <p className="text-lg font-display font-bold text-foreground">{s.count}</p>
            <p className="text-[10px] text-muted-foreground font-body">{s.label}</p>
          </div>
        ))}
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
          dragOver ? 'border-primary bg-primary/5 shadow-md scale-[1.01]' : 'border-border hover:border-primary/40 hover:bg-primary/3 bg-card'
        }`}
      >
        <input ref={fileInputRef} type="file" multiple onChange={e => handleFileUpload(e.target.files)} className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.webm,.mov,.avi,.jpg,.jpeg,.png,.gif,.webp,.svg" />
        <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all ${dragOver ? 'gradient-muscle scale-110' : 'bg-primary/10'}`}>
          <Upload className={`w-6 h-6 ${dragOver ? 'text-white' : 'text-primary'}`} />
        </div>
        <p className="font-display text-[14px] font-semibold text-foreground mb-1">
          {dragOver ? 'Déposez vos fichiers ici' : 'Importer des fichiers'}
        </p>
        <p className="text-[12px] text-muted-foreground font-body">PDF, Word, Vidéo, Images — les fichiers sont sauvegardés pour cette session</p>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-card border-border h-10 rounded-xl text-[13px] font-body shadow-sm" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {fileTypes.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-2 rounded-lg text-[11px] font-semibold font-body transition-all ${
                  filter === t ? 'gradient-muscle text-white shadow-sm' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}>
                {t === 'all' ? `Tous (${files.length})` : `${t.toUpperCase()} (${files.filter(f => f.type === t).length})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredFiles.length === 0 && files.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-12 text-center shadow-card">
          <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-[13px] text-muted-foreground font-body">Aucun fichier trouvé</p>
        </div>
      )}

      {filteredFiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFiles.map(file => {
            const Icon = FILE_ICONS[file.type] || File;
            const colors = FILE_COLORS[file.type] || FILE_COLORS.attachment;

            return (
              <div key={file.id} className="group rounded-2xl bg-card border border-border hover:shadow-card-hover shadow-card transition-all duration-300 overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate font-body text-foreground">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colors.badge}`}>{file.type.toUpperCase()}</span>
                      <span className="text-[10px] text-muted-foreground font-body">{formatSize(file.size)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => deleteFile(file.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quiz Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-display font-bold text-foreground">Quiz / Tests</h2>
            <span className="text-[11px] text-muted-foreground font-body">({courseQuizzes.length})</span>
          </div>
          <Button
            onClick={() => { setShowQuizForm(true); setEditingQuiz(null); setQuizForm({ ...emptyQuiz, courseId: courseId }); }}
            className="gradient-muscle text-primary-foreground hover:opacity-90 rounded-xl h-9 text-[13px] shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Nouveau Quiz
          </Button>
        </div>

        {showQuizForm && (
          <div className="rounded-2xl bg-card border border-primary/15 p-6 animate-slide-up shadow-card mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-[15px] font-semibold">{editingQuiz ? 'Modifier le Quiz' : 'Nouveau Quiz'}</h3>
              <button onClick={() => { setShowQuizForm(false); setEditingQuiz(null); setQuizForm(emptyQuiz); }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <Input placeholder="Titre du quiz" value={quizForm.title || ''} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} className="bg-background border-border h-10 rounded-xl text-[13px]" />
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground font-body">Notation</label>
                <div className="flex gap-1.5">
                  {[10, 20].map(b => (
                    <button key={b} onClick={() => setQuizForm({ ...quizForm, gradeBase: b })} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all font-body ${quizForm.gradeBase === b ? 'gradient-muscle text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>/{b}</button>
                  ))}
                </div>
              </div>
              <textarea placeholder="Description (optionnel)" value={quizForm.description || ''} onChange={e => setQuizForm({ ...quizForm, description: e.target.value })} className="w-full h-20 rounded-xl bg-background border border-border px-3 py-2 text-[13px] text-foreground resize-none font-body md:col-span-2" />
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-semibold font-body text-foreground">Questions ({(quizForm.questions || []).length})</h4>
                <Button variant="ghost" size="sm" onClick={addQuestion} className="text-primary text-[12px] h-7"><Plus className="w-3 h-3 mr-1" /> Ajouter</Button>
              </div>
              {(quizForm.questions || []).map((q, i) => (
                <QuestionEditor key={q.id} question={q} onChange={q => updateQuestion(i, q)} onDelete={() => deleteQuestion(i)} />
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setShowQuizForm(false); setEditingQuiz(null); setQuizForm(emptyQuiz); }} className="rounded-xl text-[13px] h-9">Annuler</Button>
              <Button onClick={handleQuizSave} className="gradient-muscle text-primary-foreground rounded-xl text-[13px] h-9">Enregistrer</Button>
            </div>
          </div>
        )}

        {courseQuizzes.length === 0 && !showQuizForm ? (
          <div className="rounded-2xl bg-card border border-border p-12 text-center shadow-card">
            <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-[13px] font-body">Aucun quiz pour ce cours</p>
            <p className="text-muted-foreground text-[11px] font-body mt-1">Créez un quiz pour évaluer les connaissances des stagiaires</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courseQuizzes.map(q => (
              <div key={q.id} className="rounded-2xl bg-card border border-border p-5 hover:shadow-card-hover shadow-card transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl gradient-muscle flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display text-[14px] font-semibold text-foreground">{q.title}</h3>
                      <p className="text-[11px] text-muted-foreground font-body">{q.questions.length} question(s) • /{q.gradeBase || 20}</p>
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
                      <Button size="sm" onClick={() => handleStartQuiz(q)} className="gradient-muscle text-primary-foreground text-[11px] h-7 rounded-lg">
                        <Play className="w-3 h-3 mr-1" /> {q.status === 'completed' ? 'Relancer' : 'Lancer'}
                      </Button>
                    )}
                    <button onClick={() => { setEditingQuiz(q); setQuizForm(q); setShowQuizForm(true); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteQuiz(q.id)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

