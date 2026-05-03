import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStages, getCoursesByStage, saveCourse, deleteCourse, genId } from '@/lib/store';
import { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus, Pencil, Trash2, BookOpen, X, Search, ArrowLeft,
  FileText, Video, Image, File, FolderOpen, ArrowRight,
  Sparkles, GraduationCap, Layers
} from 'lucide-react';

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: 'text-red-500 bg-red-50', doc: 'text-blue-500 bg-blue-50',
  video: 'text-violet-500 bg-violet-50', image: 'text-emerald-500 bg-emerald-50',
  ppt: 'text-amber-500 bg-amber-50', attachment: 'text-slate-500 bg-slate-50',
};
const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText, doc: FileText, video: Video, image: Image, ppt: FileText, attachment: File,
};

const accentColors = [
  'from-orange-500/8 to-amber-500/4 hover:from-orange-500/12 hover:to-amber-500/8',
  'from-blue-500/8 to-cyan-500/4 hover:from-blue-500/12 hover:to-cyan-500/8',
  'from-emerald-500/8 to-teal-500/4 hover:from-emerald-500/12 hover:to-teal-500/8',
  'from-violet-500/8 to-purple-500/4 hover:from-violet-500/12 hover:to-purple-500/8',
  'from-rose-500/8 to-pink-500/4 hover:from-rose-500/12 hover:to-pink-500/8',
];
const iconAccents = [
  'from-orange-500 to-amber-500', 'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500', 'from-violet-500 to-purple-500', 'from-rose-500 to-pink-500',
];

export default function AdminStageCourses() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = getStages().find(s => s.id === stageId);
  const [courses, setCourses] = useState(() => getCoursesByStage(stageId || ''));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');

  const refresh = () => setCourses(getCoursesByStage(stageId || ''));

  const filtered = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter(c => c.title.toLowerCase().includes(q));
  }, [courses, search]);

  const handleSave = () => {
    if (!title.trim() || !stageId) return;
    const existing = editingId ? courses.find(c => c.id === editingId) : null;
    const course: Course = {
      id: existing?.id || genId(),
      stageId,
      title: title.trim(),
      description: description.trim(),
      files: existing?.files || [],
      assignedStudents: existing?.assignedStudents || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    saveCourse(course);
    setShowForm(false); setEditingId(null); setTitle(''); setDescription('');
    refresh();
  };

  if (!stage) return (
    <div className="text-center py-20">
      <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-[14px] text-muted-foreground font-body">Stage introuvable</p>
      <Button variant="ghost" onClick={() => navigate('/admin/stages')} className="mt-4 rounded-xl text-[13px]">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/stages')} className="rounded-xl text-[13px] h-9 px-3">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Stages
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold gradient-muscle text-white">{stage.code}</span>
            <h1 className="text-xl font-display font-bold text-foreground">{stage.name}</h1>
          </div>
          <p className="text-[12px] text-muted-foreground font-body mt-0.5">{stage.description} • {courses.length} cours</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setTitle(''); setDescription(''); }}
          className="gradient-muscle text-primary-foreground hover:opacity-90 rounded-xl shadow-sm h-10 text-[13px] gap-2 px-5">
          <Plus className="w-4 h-4" /> Nouveau Cours
        </Button>
      </div>

      {courses.length > 3 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un cours..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-11 bg-card border-border h-11 rounded-xl text-[13px] font-body shadow-card" />
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl bg-card border border-primary/15 p-6 animate-slide-up shadow-elevated">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl gradient-muscle flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <h3 className="font-display text-[16px] font-semibold">{editingId ? 'Modifier' : 'Nouveau Cours'}</h3>
            </div>
            <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-4">
            <Input placeholder="Titre du cours (ex: Anatomie Musculaire)" value={title} onChange={e => setTitle(e.target.value)}
              className="bg-background border-border h-11 rounded-xl text-[13px]" />
            <textarea placeholder="Description..." value={description} onChange={e => setDescription(e.target.value)}
              className="w-full h-20 rounded-xl bg-background border border-border px-4 py-3 text-[13px] text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 font-body" />
          </div>
          <div className="flex justify-end gap-2.5 mt-5">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl text-[13px] h-10">Annuler</Button>
            <Button onClick={handleSave} className="gradient-muscle text-primary-foreground rounded-xl text-[13px] h-10 px-6">
              {editingId ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-20 text-center shadow-card">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-[16px] font-semibold mb-2">{search ? 'Aucun résultat' : 'Aucun cours'}</h3>
          <p className="text-muted-foreground text-[13px] font-body">
            {search ? 'Essayez d\'autres mots-clés' : 'Créez votre premier cours dans ce stage'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((c, i) => {
            const fileStats: Record<string, number> = {};
            (c.files || []).forEach(f => { fileStats[f.type] = (fileStats[f.type] || 0) + 1; });
            const ci = i % accentColors.length;

            return (
              <div key={c.id}
                className={`group relative rounded-2xl bg-gradient-to-br ${accentColors[ci]} bg-card border border-border/60 hover:border-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden`}>
                <div className={`h-1.5 bg-gradient-to-r ${iconAccents[ci]} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconAccents[ci]} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={e => { e.stopPropagation(); setEditingId(c.id); setTitle(c.title); setDescription(c.description); setShowForm(true); }}
                        className="p-2 rounded-lg bg-card/90 text-muted-foreground hover:text-primary border border-border/50 shadow-sm">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteCourse(c.id); refresh(); }}
                        className="p-2 rounded-lg bg-card/90 text-muted-foreground hover:text-destructive border border-border/50 shadow-sm">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-[15px] mb-1.5 line-clamp-1 text-foreground">{c.title}</h3>
                  <p className="text-[12px] text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem] font-body">{c.description || 'Pas de description'}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {Object.entries(fileStats).map(([type, count]) => {
                      const Icon = FILE_ICONS[type] || File;
                      return (
                        <span key={type} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${FILE_TYPE_COLORS[type] || FILE_TYPE_COLORS.attachment}`}>
                          <Icon className="w-3 h-3" /> {count}
                        </span>
                      );
                    })}
                    {(!c.files || c.files.length === 0) && <span className="text-[11px] text-muted-foreground/50 font-body italic">Aucun fichier</span>}
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3 font-body">
                    <span className="flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5 text-primary/50" />{(c.files || []).length} fichier{(c.files || []).length !== 1 ? 's' : ''}</span>
                  </div>
                  <button onClick={() => navigate(`/admin/stages/${stageId}/courses/${c.id}`)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r ${iconAccents[ci]} text-white text-[12px] font-semibold hover:opacity-90 shadow-sm`}>
                    <FolderOpen className="w-3.5 h-3.5" /> Gérer le contenu <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

