import React, { useMemo, useState } from 'react';
import { getCourses, getStages } from '@/lib/store';
import {
  BookOpen, GraduationCap, Search, FileText, Video, Image, File,
  ArrowRight, FolderOpen
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText, doc: FileText, video: Video, image: Image, ppt: FileText, attachment: File,
};
const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: 'text-red-500 bg-red-50', doc: 'text-blue-500 bg-blue-50',
  video: 'text-violet-500 bg-violet-50', image: 'text-emerald-500 bg-emerald-50',
  ppt: 'text-amber-500 bg-amber-50', attachment: 'text-slate-500 bg-slate-50',
};

const stageGradients = [
  'from-orange-500 to-amber-500', 'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500', 'from-violet-500 to-purple-500',
  'from-rose-500 to-pink-500',
];
const cardBgs = [
  'from-orange-500/8 to-amber-500/4', 'from-blue-500/8 to-cyan-500/4',
  'from-emerald-500/8 to-teal-500/4', 'from-violet-500/8 to-purple-500/4',
  'from-rose-500/8 to-pink-500/4',
];

export default function StudentCourses() {
  const courses = getCourses();
  const stages = getStages();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');

  const selectedStageParam = searchParams.get('stage') || 'all';
  const selectedStage = selectedStageParam === 'all' || stages.some(s => s.id === selectedStageParam)
    ? selectedStageParam
    : 'all';
  const selectedStageLabel = selectedStage === 'all'
    ? 'Tous les stages'
    : stages.find(s => s.id === selectedStage)?.code || 'Tous les stages';

  const filtered = useMemo(() => {
    let list = courses;
    if (selectedStage !== 'all') list = list.filter(c => c.stageId === selectedStage);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    return list;
  }, [courses, search, selectedStage]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          Mes Cours
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1 font-body">
          Vos formations par stage • Filtre: {selectedStageLabel}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher un cours..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-11 bg-card border-border h-11 rounded-xl text-[13px] font-body shadow-card" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-20 text-center shadow-card">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-[16px] font-semibold mb-2">{search ? 'Aucun résultat' : 'Aucun cours'}</h3>
          <p className="text-muted-foreground text-[13px] font-body">{search ? 'Essayez d\'autres mots-clés' : 'Revenez bientôt'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c, i) => {
            const stage = stages.find(s => s.id === c.stageId);
            const si = stage ? stages.indexOf(stage) % stageGradients.length : -1;
            const colorIdx = si >= 0 ? si : i % stageGradients.length;
            const fileTypes: Record<string, number> = {};
            (c.files || []).forEach(f => { fileTypes[f.type] = (fileTypes[f.type] || 0) + 1; });

            return (
              <div key={c.id} onClick={() => navigate(`/student/courses/${c.id}`)}
                className={`group relative rounded-2xl bg-gradient-to-br ${cardBgs[colorIdx]} bg-card border border-border/60 hover:border-border shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer overflow-hidden`}>

                <div className={`h-1.5 bg-gradient-to-r ${stageGradients[colorIdx]} opacity-50 group-hover:opacity-100 transition-opacity`} />

                <div className="p-5 pb-3">
                  {stage && (
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-gradient-to-r ${stageGradients[colorIdx]} text-white mb-3`}>
                      {stage.code}
                    </span>
                  )}

                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stageGradients[colorIdx]} flex items-center justify-center shadow-lg mb-4 group-hover:scale-105 transition-transform`}>
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="font-display font-bold text-[15px] mb-1.5 line-clamp-1 text-foreground">{c.title}</h3>
                  <p className="text-[12px] text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem] font-body">{c.description || 'Pas de description'}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {Object.entries(fileTypes).map(([type, count]) => {
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
                  <div className={`flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r ${stageGradients[colorIdx]} text-white text-[12px] font-semibold group-hover:opacity-90 transition-all shadow-sm`}>
                    Ouvrir <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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

