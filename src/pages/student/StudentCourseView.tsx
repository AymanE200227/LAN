import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourses, getQuizzes } from '@/lib/store';
import { CourseFile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, FileText, File, Image, Video, Download, BookOpen,
  Play, Eye, Search, FolderOpen, X, ClipboardList
} from 'lucide-react';

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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function StudentCourseView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = getCourses().find(c => c.id === courseId);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<CourseFile | null>(null);

  const availableQuizzes = getQuizzes().filter(q => q.status === 'active' || q.status === 'published');
  const courseTests = course ? availableQuizzes.filter(q => q.courseId === course.id && !q.id.startsWith('quiz-stage-general-')) : [];
  const stageGeneralTest = course ? availableQuizzes.find(q => q.stageId === course.stageId && q.id.startsWith('quiz-stage-general-')) : null;

  if (!course) return (
    <div className="text-center py-20">
      <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
      <p className="font-display text-[15px] text-foreground">Cours introuvable</p>
      <Button variant="ghost" onClick={() => navigate('/student/courses')} className="mt-4 rounded-xl text-[13px]">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour
      </Button>
    </div>
  );

  const fileTypes = ['all', ...new Set(course.files.map(f => f.type))];
  const filteredFiles = course.files.filter(f => {
    if (filter !== 'all' && f.type !== filter) return false;
    if (search.trim() && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/student/courses')} className="rounded-xl text-[13px] h-9 px-3">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour
        </Button>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            {course.title}
          </h1>
          <p className="text-[12px] text-muted-foreground font-body mt-0.5">{course.files.length} fichier{course.files.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {(courseTests.length > 0 || stageGeneralTest) && (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-card">
          <h3 className="text-[13px] font-semibold font-body text-foreground flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-primary" />
            Examens du cours
          </h3>
          <div className="flex flex-wrap gap-2">
            {courseTests.map(test => (
              <Button
                key={test.id}
                onClick={() => navigate(`/student/quizzes/${test.id}`)}
                className="gradient-muscle text-primary-foreground rounded-xl h-9 text-[12px] shadow-sm"
              >
                <Play className="w-3.5 h-3.5 mr-1.5" />
                {test.title}
              </Button>
            ))}
            {stageGeneralTest && (
              <Button
                variant="outline"
                onClick={() => navigate(`/student/quizzes/${stageGeneralTest.id}`)}
                className="rounded-xl h-9 text-[12px]"
              >
                <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
                {stageGeneralTest.title}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filter & Search */}
      {course.files.length > 0 && (
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
                {t === 'all' ? `Tous (${course.files.length})` : `${t.toUpperCase()} (${course.files.filter(f => f.type === t).length})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File Grid */}
      {course.files.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-20 text-center shadow-card">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-[16px] font-semibold mb-2">Aucun fichier</h3>
          <p className="text-muted-foreground text-[13px] font-body">Ce cours n'a pas encore de contenu</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 text-center shadow-card">
          <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-[13px] text-muted-foreground font-body">Aucun fichier trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map(file => {
            const Icon = FILE_ICONS[file.type] || File;
            const colors = FILE_COLORS[file.type] || FILE_COLORS.attachment;
            const isVideo = file.type === 'video';
            const isImage = file.type === 'image';
            const canPreview = isVideo || isImage;

            return (
              <div key={file.id}
                className="group rounded-2xl bg-card border border-border hover:shadow-card-hover shadow-card transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => canPreview ? setPreview(file) : undefined}>
                
                {/* Preview thumbnail */}
                {(isVideo || isImage) && file.url && (
                  <div className="relative h-36 bg-secondary overflow-hidden">
                    {isVideo ? (
                      <>
                        <video src={file.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 text-violet-600 ml-0.5" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}
                  </div>
                )}

                {/* Non-media icon */}
                {!isVideo && !isImage && (
                  <div className={`h-28 ${colors.bg} flex items-center justify-center`}>
                    <Icon className={`w-10 h-10 ${colors.text} opacity-60`} />
                  </div>
                )}

                <div className="p-4">
                  <p className="text-[13px] font-semibold truncate font-body text-foreground mb-1">{file.name}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colors.badge}`}>{file.type.toUpperCase()}</span>
                      <span className="text-[10px] text-muted-foreground font-body">{formatSize(file.size)}</span>
                    </div>
                    <a href={file.url || '#'} target="_blank" rel="noopener noreferrer" download={file.name}
                      onClick={e => e.stopPropagation()}
                      className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-card rounded-2xl overflow-hidden shadow-elevated" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <p className="font-display text-[14px] font-semibold truncate">{preview.name}</p>
              <button onClick={() => setPreview(null)} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-secondary/30 min-h-[400px]">
              {preview.type === 'video' ? (
                <video src={preview.url} controls autoPlay className="max-w-full max-h-[70vh] rounded-xl" />
              ) : (
                <img src={preview.url} alt={preview.name} className="max-w-full max-h-[70vh] rounded-xl object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



