import React, { useState } from 'react';
import { getStages, saveStage, deleteStage, getCoursesByStage, genId } from '@/lib/store';
import { Stage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus, Pencil, Trash2, Layers, X, ArrowRight, BookOpen,
  FolderOpen, Sparkles, GraduationCap, FileText, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const stageColors = [
  { gradient: 'from-orange-500 to-amber-500', bg: 'from-orange-500/8 to-amber-500/4', light: 'bg-orange-50' },
  { gradient: 'from-blue-500 to-cyan-500', bg: 'from-blue-500/8 to-cyan-500/4', light: 'bg-blue-50' },
  { gradient: 'from-emerald-500 to-teal-500', bg: 'from-emerald-500/8 to-teal-500/4', light: 'bg-emerald-50' },
  { gradient: 'from-violet-500 to-purple-500', bg: 'from-violet-500/8 to-purple-500/4', light: 'bg-violet-50' },
  { gradient: 'from-rose-500 to-pink-500', bg: 'from-rose-500/8 to-pink-500/4', light: 'bg-rose-50' },
  { gradient: 'from-amber-500 to-yellow-500', bg: 'from-amber-500/8 to-yellow-500/4', light: 'bg-amber-50' },
];

export default function AdminStages() {
  const [stages, setStages] = useState(getStages());
  const [expandedStages, setExpandedStages] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Stage | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const navigate = useNavigate();

  const refresh = () => setStages(getStages());

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim()) return;
    const stage: Stage = {
      id: editing?.id || genId(),
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      order: editing?.order || stages.length + 1,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    saveStage(stage);
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', code: '', description: '' });
    refresh();
  };

  const toggleStageDropdown = (stageId: string) => {
    setExpandedStages(prev =>
      prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-primary" />
            Gestion des Stages
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1 font-body">{stages.length} stages configurés</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', code: '', description: '' }); }}
          className="gradient-muscle text-primary-foreground hover:opacity-90 rounded-xl shadow-sm h-10 text-[13px] gap-2 px-5">
          <Plus className="w-4 h-4" /> Nouveau Stage
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-card border border-primary/15 p-6 animate-slide-up shadow-elevated">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl gradient-muscle flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <h3 className="font-display text-[16px] font-semibold">{editing ? 'Modifier le Stage' : 'Nouveau Stage'}</h3>
            </div>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Code (ex: CAT1)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
              className="bg-background border-border h-11 rounded-xl text-[13px] uppercase" />
            <Input placeholder="Nom du stage" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="bg-background border-border h-11 rounded-xl text-[13px]" />
            <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="bg-background border-border h-11 rounded-xl text-[13px]" />
          </div>
          <div className="flex justify-end gap-2.5 mt-5">
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-xl text-[13px] h-10">Annuler</Button>
            <Button onClick={handleSave} className="gradient-muscle text-primary-foreground rounded-xl text-[13px] h-10 px-6">Enregistrer</Button>
          </div>
        </div>
      )}

      {stages.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-20 text-center shadow-card">
          <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-[16px] font-semibold mb-2">Aucun stage</h3>
          <p className="text-muted-foreground text-[13px] font-body">Créez votre premier stage pour organiser les cours</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {stages.map((stage, i) => {
            const courses = getCoursesByStage(stage.id);
            const totalFiles = courses.reduce((s, c) => s + (c.files?.length || 0), 0);
            const color = stageColors[i % stageColors.length];
            const isExpanded = expandedStages.includes(stage.id);

            return (
              <div key={stage.id}
                className={`group relative rounded-2xl bg-gradient-to-br ${color.bg} bg-card border border-border/60 hover:border-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden`}>
                
                <div className={`h-1.5 bg-gradient-to-r ${color.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color.gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={e => { e.stopPropagation(); setEditing(stage); setForm({ name: stage.name, code: stage.code, description: stage.description }); setShowForm(true); }}
                        className="p-2 rounded-lg bg-card/90 text-muted-foreground hover:text-primary border border-border/50 shadow-sm">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteStage(stage.id); refresh(); }}
                        className="p-2 rounded-lg bg-card/90 text-muted-foreground hover:text-destructive border border-border/50 shadow-sm">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-1">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gradient-to-r ${color.gradient} text-white shadow-sm`}>
                      {stage.code}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[15px] mb-1 text-foreground">{stage.name}</h3>
                  <p className="text-[12px] text-muted-foreground line-clamp-2 mb-4 font-body">{stage.description || 'Pas de description'}</p>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-body mb-4">
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-primary/50" />{courses.length} cours</span>
                    <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-primary/50" />{totalFiles} fichiers</span>
                  </div>

                  <button
                    onClick={e => { e.stopPropagation(); toggleStageDropdown(stage.id); }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] font-medium font-body transition-all',
                      isExpanded
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <FolderOpen className="w-3.5 h-3.5" />
                      Liste des cours
                    </span>
                    <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
                  </button>

                  <div className={cn(
                    'overflow-hidden transition-all duration-300',
                    isExpanded ? 'max-h-56 opacity-100 mt-2' : 'max-h-0 opacity-0'
                  )}>
                    <div className="space-y-1 rounded-xl border border-border/50 bg-background/70 p-2">
                      {courses.length === 0 ? (
                        <p className="px-2 py-1 text-[11px] text-muted-foreground font-body">Aucun cours dans ce stage</p>
                      ) : (
                        courses.map(course => (
                          <button
                            key={course.id}
                            onClick={e => {
                              e.stopPropagation();
                              navigate(`/admin/stages/${stage.id}/courses/${course.id}`);
                            }}
                            className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-body text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          >
                            <span className="truncate">{course.title}</span>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button onClick={() => navigate(`/admin/stages/${stage.id}`)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r ${color.gradient} text-white text-[12px] font-semibold hover:opacity-90 transition-all shadow-sm`}>
                    <FolderOpen className="w-3.5 h-3.5" /> Voir les cours <ArrowRight className="w-3.5 h-3.5" />
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

