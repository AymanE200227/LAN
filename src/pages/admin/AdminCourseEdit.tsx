import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourses, saveCourse, getQuizzes, saveQuiz, deleteQuiz, genId } from '@/lib/store';
import { Course, CourseFile, Quiz, Question, Answer } from '@/types';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Upload, Trash2, FileText, Video, File, Image, X,
  FolderOpen, Download, Play, Search, ClipboardList, Plus, Pencil,
  ChevronDown, ChevronUp, Check, Eye, Save, BookOpen, GraduationCap,
  LayoutGrid, List, Calendar, HardDrive
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const TIMER_OPTIONS = [5, 10, 15, 30, 60];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB per file for base64 localStorage

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

const FILE_COLORS: Record<string, { bg: string; text: string; badge: string; border: string }> = {
  pdf: { bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100 text-red-700', border: 'border-red-200' },
  doc: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  video: { bg: 'bg-violet-50', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700', border: 'border-violet-200' },
  image: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
  ppt: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  attachment: { bg: 'bg-slate-50', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700', border: 'border-slate-200' },
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

function fileToBase64(file: globalThis.File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function AdminCourseEdit() {
  const { courseId, stageId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(() => getCourses().find(c => c.id === courseId) || null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewFile, setPreviewFile] = useState<CourseFile | null>(null);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
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

  const startEditCourse = useCallback(() => {
    if (!course) return;
    setEditTitle(course.title);
    setEditDescription(course.description || '');
    setIsEditingCourse(true);
  }, [course]);

  const saveEditCourse = useCallback(() => {
    if (!course || !editTitle.trim()) { toast.error('Le titre est requis'); return; }
    const updated = { ...course, title: editTitle.trim(), description: editDescription.trim() };
    setCourse(updated);
    saveCourse(updated);
    setIsEditingCourse(false);
    toast.success('Cours mis à jour');
  }, [course, editTitle, editDescription]);

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-display font-bold text-foreground mb-2">Cours introuvable</h2>
          <p className="text-[13px] text-muted-foreground font-body mb-6">Ce cours n'existe pas ou a été supprimé.</p>
          <Button onClick={() => navigate(backPath)} className="rounded-xl text-[13px] h-10 px-6 gradient-muscle text-primary-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux stages
          </Button>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadProgress(0);

    const newFiles: CourseFile[] = [];
    const totalFiles = fileList.length;
    let processed = 0;
    let skipped = 0;

    for (const file of Array.from(fileList)) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" dépasse la limite de 4 MB`);
        skipped++;
        processed++;
        setUploadProgress(Math.round((processed / totalFiles) * 100));
        continue;
      }

      try {
        const dataUrl = await fileToBase64(file);
        newFiles.push({
          id: genId(),
          name: file.name,
          type: getFileType(file),
          url: dataUrl,
          size: file.size,
        });
      } catch {
        toast.error(`Erreur lors de l'import de "${file.name}"`);
        skipped++;
      }

      processed++;
      setUploadProgress(Math.round((processed / totalFiles) * 100));
    }

    if (newFiles.length > 0) {
      const updated = { ...course, files: [...(course.files || []), ...newFiles] };
      setCourse(updated);
      saveCourse(updated);
      toast.success(`${newFiles.length} fichier(s) importé(s)${skipped > 0 ? ` · ${skipped} ignoré(s)` : ''}`);
    }

    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 600);
  };

  const deleteFile = (fileId: string) => {
    const updated = { ...course, files: (course.files || []).filter(f => f.id !== fileId) };
    setCourse(updated);
    saveCourse(updated);
    setDeleteConfirm(null);
    toast.success('Fichier supprimé');
  };

  const downloadFile = (file: CourseFile) => {
    if (!file.url) { toast.error('Fichier non disponible'); return; }
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const files = course.files || [];
  const fileTypes = ['all', ...Array.from(new Set(files.map(f => f.type)))];
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

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="space-y-0 animate-fade-in max-w-6xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground font-body mb-4">
        <button onClick={() => navigate('/admin/stages')} className="hover:text-primary transition-colors">Stages</button>
        <span>/</span>
        <button onClick={() => navigate(backPath)} className="hover:text-primary transition-colors">{stageId?.replace('stage-', '').toUpperCase()}</button>
        <span>/</span>
        <span className="text-foreground font-medium">{course.title}</span>
      </div>

      {/* Course Header Card */}
      <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden mb-6">
        <div className="gradient-muscle p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(backPath)} className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl h-9 px-3">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour
              </Button>
            </div>
            {!isEditingCourse && (
              <Button variant="ghost" size="sm" onClick={startEditCourse} className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl h-9 px-3">
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Modifier
              </Button>
            )}
          </div>

          {isEditingCourse ? (
            <div className="mt-4 space-y-3">
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Titre du cours"
                className="bg-white/15 border-white/20 text-white placeholder:text-white/50 h-11 text-lg font-display font-bold rounded-xl" />
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Description du cours (optionnel)"
                className="w-full bg-white/15 border border-white/20 text-white placeholder:text-white/50 rounded-xl px-3 py-2.5 text-[13px] font-body resize-none h-20" />
              <div className="flex gap-2">
                <Button onClick={saveEditCourse} className="bg-white text-primary hover:bg-white/90 rounded-xl h-9 text-[13px] shadow-sm">
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Enregistrer
                </Button>
                <Button variant="ghost" onClick={() => setIsEditingCourse(false)} className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-9 text-[13px]">
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2.5">
                <BookOpen className="w-6 h-6" />
                {course.title}
              </h1>
              <p className="text-white/70 text-[13px] font-body mt-1.5">{course.description || 'Aucune description'}</p>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-4 bg-card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <HardDrive className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="text-[18px] font-display font-bold text-foreground">{files.length}</p>
                <p className="text-[11px] text-muted-foreground font-body">Fichiers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <ClipboardList className="w-4.5 h-4.5 text-violet-600" />
              </div>
              <div>
                <p className="text-[18px] font-display font-bold text-foreground">{courseQuizzes.length}</p>
                <p className="text-[11px] text-muted-foreground font-body">Quiz</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <GraduationCap className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[18px] font-display font-bold text-foreground">{course.assignedStudents?.length || 0}</p>
                <p className="text-[11px] text-muted-foreground font-body">Stagiaires</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Calendar className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div>
                <p className="text-[13px] font-display font-bold text-foreground">{formatDate(course.createdAt)}</p>
                <p className="text-[11px] text-muted-foreground font-body">Créé le</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Tabs */}
      <Tabs defaultValue="files" className="w-full">
        <TabsList className="w-full sm:w-auto bg-muted/50 border border-border rounded-xl p-1 h-auto mb-6">
          <TabsTrigger value="files" className="rounded-lg text-[13px] font-body data-[state=active]:gradient-muscle data-[state=active]:text-white px-4 py-2 gap-2">
            <FolderOpen className="w-4 h-4" /> Fichiers <span className="text-[11px] opacity-70">({files.length})</span>
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="rounded-lg text-[13px] font-body data-[state=active]:gradient-muscle data-[state=active]:text-white px-4 py-2 gap-2">
            <ClipboardList className="w-4 h-4" /> Quiz / Tests <span className="text-[11px] opacity-70">({courseQuizzes.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── FILES TAB ─── */}
        <TabsContent value="files" className="space-y-5 mt-0">

          {/* File Type Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'PDF', count: stats.pdf, icon: FileText, color: FILE_COLORS.pdf },
              { label: 'Word', count: stats.doc, icon: FileText, color: FILE_COLORS.doc },
              { label: 'Vidéos', count: stats.video, icon: Video, color: FILE_COLORS.video },
              { label: 'Images', count: stats.image, icon: Image, color: FILE_COLORS.image },
              { label: 'Autres', count: stats.other, icon: File, color: FILE_COLORS.attachment },
            ].map(s => (
              <button key={s.label} onClick={() => setFilter(s.count > 0 ? (s.label === 'PDF' ? 'pdf' : s.label === 'Word' ? 'doc' : s.label === 'Vidéos' ? 'video' : s.label === 'Images' ? 'image' : 'all') : 'all')}
                className={`rounded-xl ${s.color.bg} border ${s.color.border} p-3.5 text-center transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer`}>
                <s.icon className={`w-5 h-5 mx-auto mb-1.5 ${s.color.text}`} />
                <p className="text-xl font-display font-bold text-foreground">{s.count}</p>
                <p className="text-[10px] text-muted-foreground font-body mt-0.5">{s.label}</p>
              </button>
            ))}
          </div>

          {/* Upload Area */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300 ${
              dragOver ? 'border-primary bg-primary/5 shadow-lg scale-[1.01]' : 'border-border hover:border-primary/40 hover:bg-primary/3 bg-card'
            }`}
          >
            <input ref={fileInputRef} type="file" multiple onChange={e => { handleFileUpload(e.target.files); e.target.value = ''; }} className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.webm,.mov,.avi,.jpg,.jpeg,.png,.gif,.webp,.svg" />

            {uploading ? (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl gradient-muscle mx-auto flex items-center justify-center animate-pulse">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <p className="font-display text-[14px] font-semibold text-foreground">Import en cours...</p>
                <Progress value={uploadProgress} className="h-2 max-w-xs mx-auto" />
                <p className="text-[12px] text-muted-foreground font-body">{uploadProgress}%</p>
              </div>
            ) : (
              <>
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all ${dragOver ? 'gradient-muscle scale-110' : 'bg-primary/10'}`}>
                  <Upload className={`w-7 h-7 ${dragOver ? 'text-white' : 'text-primary'}`} />
                </div>
                <p className="font-display text-[15px] font-semibold text-foreground mb-1">
                  {dragOver ? 'Déposez vos fichiers ici' : 'Glissez-déposez ou cliquez pour importer'}
                </p>
                <p className="text-[12px] text-muted-foreground font-body">PDF, Word, PowerPoint, Vidéos, Images — Max 4 MB par fichier</p>
                {totalSize > 0 && (
                  <p className="text-[11px] text-muted-foreground/70 font-body mt-2">Stockage utilisé : {formatSize(totalSize)}</p>
                )}
              </>
            )}
          </div>

          {/* Search & Filters */}
          {files.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Rechercher un fichier..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-10 bg-card border-border h-10 rounded-xl text-[13px] font-body shadow-sm" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 flex-wrap">
                  {fileTypes.map(t => (
                    <button key={t} onClick={() => setFilter(t)}
                      className={`px-3 py-2 rounded-lg text-[11px] font-semibold font-body transition-all ${
                        filter === t ? 'gradient-muscle text-white shadow-sm' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                      }`}>
                      {t === 'all' ? `Tous (${files.length})` : `${t.toUpperCase()} (${files.filter(f => f.type === t).length})`}
                    </button>
                  ))}
                </div>
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {files.length === 0 && (
            <div className="rounded-2xl bg-card border border-dashed border-border p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
                <FolderOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-[15px] font-display font-semibold text-foreground mb-2">Aucun fichier</h3>
              <p className="text-[13px] text-muted-foreground font-body max-w-sm mx-auto">
                Importez des fichiers PDF, Word, vidéos ou images pour enrichir ce cours.
              </p>
              <Button onClick={() => fileInputRef.current?.click()} className="mt-5 gradient-muscle text-primary-foreground rounded-xl h-10 text-[13px] shadow-sm">
                <Upload className="w-4 h-4 mr-2" /> Importer des fichiers
              </Button>
            </div>
          )}

          {/* No Results */}
          {filteredFiles.length === 0 && files.length > 0 && (
            <div className="rounded-2xl bg-card border border-border p-12 text-center shadow-card">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-[13px] text-muted-foreground font-body">Aucun fichier trouvé pour "{search || filter}"</p>
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilter('all'); }} className="mt-2 text-[12px] text-primary">
                Réinitialiser les filtres
              </Button>
            </div>
          )}

          {/* Files Grid */}
          {filteredFiles.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredFiles.map(file => {
                const Icon = FILE_ICONS[file.type] || File;
                const colors = FILE_COLORS[file.type] || FILE_COLORS.attachment;
                const isImage = file.type === 'image' && file.url;

                return (
                  <div key={file.id} className="group rounded-2xl bg-card border border-border hover:shadow-card-hover shadow-card transition-all duration-300 overflow-hidden">
                    {isImage && (
                      <div className="h-36 bg-muted/30 overflow-hidden cursor-pointer" onClick={() => setPreviewFile(file)}>
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <div className="p-4 flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center shrink-0 border ${colors.border}`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate font-body text-foreground">{file.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colors.badge}`}>{file.type.toUpperCase()}</span>
                          <span className="text-[10px] text-muted-foreground font-body">{formatSize(file.size)}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.url && (
                          <>
                            <button onClick={() => setPreviewFile(file)} title="Aperçu"
                              className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => downloadFile(file)} title="Télécharger"
                              className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button onClick={() => setDeleteConfirm(file.id)} title="Supprimer"
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

          {/* Files List */}
          {filteredFiles.length > 0 && viewMode === 'list' && (
            <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden divide-y divide-border">
              {filteredFiles.map(file => {
                const Icon = FILE_ICONS[file.type] || File;
                const colors = FILE_COLORS[file.type] || FILE_COLORS.attachment;

                return (
                  <div key={file.id} className="group flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center shrink-0 border ${colors.border}`}>
                      <Icon className={`w-4.5 h-4.5 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate font-body text-foreground">{file.name}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>{file.type.toUpperCase()}</span>
                    <span className="text-[11px] text-muted-foreground font-body w-16 text-right">{formatSize(file.size)}</span>
                    <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.url && (
                        <>
                          <button onClick={() => setPreviewFile(file)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => downloadFile(file)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button onClick={() => setDeleteConfirm(file.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── QUIZ TAB ─── */}
        <TabsContent value="quizzes" className="space-y-5 mt-0">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold text-foreground">Quiz & Tests</h2>
              <p className="text-[12px] text-muted-foreground font-body mt-0.5">Gérez les évaluations de ce cours</p>
            </div>
            <Button
              onClick={() => { setShowQuizForm(true); setEditingQuiz(null); setQuizForm({ ...emptyQuiz, courseId: courseId }); }}
              className="gradient-muscle text-primary-foreground hover:opacity-90 rounded-xl h-10 text-[13px] shadow-sm px-5"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Nouveau Quiz
            </Button>
          </div>

          {showQuizForm && (
            <div className="rounded-2xl bg-card border border-primary/15 p-6 animate-slide-up shadow-card">
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
            <div className="rounded-2xl bg-card border border-dashed border-border p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-5">
                <ClipboardList className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-[15px] font-display font-semibold text-foreground mb-2">Aucun quiz</h3>
              <p className="text-[13px] text-muted-foreground font-body max-w-sm mx-auto">Créez un quiz pour évaluer les connaissances des stagiaires sur ce cours.</p>
              <Button onClick={() => { setShowQuizForm(true); setEditingQuiz(null); setQuizForm({ ...emptyQuiz, courseId: courseId }); }}
                className="mt-5 gradient-muscle text-primary-foreground rounded-xl h-10 text-[13px] shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Créer un quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {courseQuizzes.map(q => (
                <div key={q.id} className="rounded-2xl bg-card border border-border p-5 hover:shadow-card-hover shadow-card transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        q.status === 'active' ? 'bg-success/15' : q.status === 'completed' ? 'bg-info/15' : 'gradient-muscle'
                      }`}>
                        <ClipboardList className={`w-4.5 h-4.5 ${
                          q.status === 'active' ? 'text-success' : q.status === 'completed' ? 'text-info' : 'text-primary-foreground'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-display text-[14px] font-semibold text-foreground">{q.title}</h3>
                        <p className="text-[11px] text-muted-foreground font-body">{q.questions.length} question(s) • /{q.gradeBase || 20}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-body font-medium ${
                        q.status === 'active'
                          ? 'bg-success/10 text-success border border-success/20'
                          : q.status === 'completed'
                            ? 'bg-info/10 text-info border border-info/20'
                            : q.status === 'published'
                              ? 'bg-warning/10 text-warning border border-warning/20'
                              : 'bg-secondary text-muted-foreground border border-border'
                      }`}>
                        {q.status === 'draft' ? 'Brouillon' : q.status === 'active' ? 'En cours' : q.status === 'published' ? 'Publié' : 'Terminé'}
                      </span>
                      {q.status !== 'active' && (
                        <Button size="sm" onClick={() => handleStartQuiz(q)} className="gradient-muscle text-primary-foreground text-[11px] h-8 rounded-lg px-3">
                          <Play className="w-3 h-3 mr-1" /> {q.status === 'completed' ? 'Relancer' : 'Lancer'}
                        </Button>
                      )}
                      <button onClick={() => { setEditingQuiz(q); setQuizForm(q); setShowQuizForm(true); }}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteQuiz(q.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── File Preview Dialog ─── */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-[15px] flex items-center gap-2">
              {previewFile && (() => {
                const Icon = FILE_ICONS[previewFile.type] || File;
                const colors = FILE_COLORS[previewFile.type] || FILE_COLORS.attachment;
                return <Icon className={`w-4.5 h-4.5 ${colors.text}`} />;
              })()}
              {previewFile?.name}
            </DialogTitle>
          </DialogHeader>
          {previewFile?.url && (
            <div className="mt-2">
              {previewFile.type === 'image' && (
                <img src={previewFile.url} alt={previewFile.name} className="w-full rounded-xl" />
              )}
              {previewFile.type === 'video' && (
                <video src={previewFile.url} controls className="w-full rounded-xl" />
              )}
              {previewFile.type === 'pdf' && (
                <iframe src={previewFile.url} className="w-full h-[60vh] rounded-xl border border-border" title={previewFile.name} />
              )}
              {!['image', 'video', 'pdf'].includes(previewFile.type) && (
                <div className="text-center py-12 text-muted-foreground font-body">
                  <File className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-[13px]">Aperçu non disponible pour ce type de fichier.</p>
                  <Button onClick={() => { downloadFile(previewFile); setPreviewFile(null); }} className="mt-4 gradient-muscle text-primary-foreground rounded-xl h-9 text-[13px]">
                    <Download className="w-4 h-4 mr-1.5" /> Télécharger
                  </Button>
                </div>
              )}
            </div>
          )}
          {previewFile && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(FILE_COLORS[previewFile.type] || FILE_COLORS.attachment).badge}`}>{previewFile.type.toUpperCase()}</span>
                <span className="text-[11px] text-muted-foreground font-body">{formatSize(previewFile.size)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { downloadFile(previewFile); }} className="rounded-xl text-[12px] h-8">
                  <Download className="w-3.5 h-3.5 mr-1" /> Télécharger
                </Button>
                <Button variant="destructive" size="sm" onClick={() => { deleteFile(previewFile.id); setPreviewFile(null); }} className="rounded-xl text-[12px] h-8">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm Dialog ─── */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-[15px]">Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground font-body mt-2">
            Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="rounded-xl text-[13px] h-9">Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteFile(deleteConfirm)} className="rounded-xl text-[13px] h-9">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
