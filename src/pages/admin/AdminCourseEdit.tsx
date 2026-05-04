import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourses, saveCourse, genId } from '@/lib/store';
import { Course, CourseFile } from '@/types';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Upload, Trash2, FileText, Video, File, Image, X,
  FolderOpen, Download, Play, Search, Scale, Pencil
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
  const [editingBareme, setEditingBareme] = useState(false);
  const [baremeInput, setBaremeInput] = useState(String(course?.bareme || 1));

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
        {/* Barème / Coefficient */}
        <div className="flex items-center gap-2">
          {editingBareme ? (
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-primary/60" />
              <Input
                type="number" min="1" step="0.5"
                value={baremeInput}
                onChange={e => setBaremeInput(e.target.value)}
                className="w-20 h-8 text-[12px] rounded-lg border-primary/30 text-center"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = parseFloat(baremeInput);
                    if (!isNaN(val) && val > 0) {
                      const updated = { ...course, bareme: val };
                      setCourse(updated);
                      saveCourse(updated);
                      toast.success(`Barème mis à jour: ${val}`);
                    }
                    setEditingBareme(false);
                  }
                  if (e.key === 'Escape') setEditingBareme(false);
                }}
              />
              <button
                onClick={() => {
                  const val = parseFloat(baremeInput);
                  if (!isNaN(val) && val > 0) {
                    const updated = { ...course, bareme: val };
                    setCourse(updated);
                    saveCourse(updated);
                    toast.success(`Barème mis à jour: ${val}`);
                  }
                  setEditingBareme(false);
                }}
                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
              >OK</button>
              <button onClick={() => setEditingBareme(false)} className="text-[11px] px-2 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setEditingBareme(true); setBaremeInput(String(course.bareme || 1)); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/8 hover:bg-primary/15 border border-primary/15 transition-all group"
              title="Modifier le barème / coefficient"
            >
              <Scale className="w-4 h-4 text-primary/60" />
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground font-body leading-none">Barème</p>
                <p className="text-[14px] font-bold text-primary font-display leading-tight">Coef. {course.bareme || 1}</p>
              </div>
              <Pencil className="w-3 h-3 text-primary/30 group-hover:text-primary/60 transition-colors" />
            </button>
          )}
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
    </div>
  );
}

