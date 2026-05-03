import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen, Users, ClipboardList,
  LogOut, Activity, Heart, ChevronDown, Layers, FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStages } from '@/lib/store';
import logoFar from '@/assets/logo-far.png';

const bottomLinks = [
  { to: '/admin/students', icon: Users, label: 'Stagiaires' },
  { to: '/admin/quizzes', icon: ClipboardList, label: 'Quiz / Examens' },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [coursDropdownOpen, setCoursDropdownOpen] = useState(false);
  const dropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const stages = getStages();

  const isCoursActive = location.pathname.includes('/admin/stages') || location.pathname.includes('/admin/courses');

  const resetTimer = () => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    if (coursDropdownOpen) {
      dropdownTimer.current = setTimeout(() => setCoursDropdownOpen(false), 15000);
    }
  };

  useEffect(() => {
    resetTimer();
    return () => { if (dropdownTimer.current) clearTimeout(dropdownTimer.current); };
  }, [coursDropdownOpen]);

  const handleDropdownInteraction = () => { resetTimer(); };

  const linkClass = (isActive: boolean) => cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-body font-medium transition-all duration-200',
    isActive
      ? 'gradient-muscle text-primary-foreground shadow-md shadow-primary/15'
      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
  );

  return (
    <aside className="w-[260px] min-h-screen bg-card border-r border-border flex flex-col shadow-sm">
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <img src={logoFar} alt="FAR" className="w-10 h-10 object-contain" width={40} height={40} />
          <div>
            <h2 className="font-display font-bold text-[15px] text-foreground leading-tight">Centre Sportif</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-body">FAR • Admin</p>
          </div>
        </div>
      </div>

      <div className="px-5 mb-2">
        <div className="h-px bg-gradient-to-r from-border via-border to-transparent" />
      </div>

      <div className="px-5 py-2 flex items-center gap-2">
        <Activity className="w-3 h-3 text-primary/50" />
        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] font-body">Navigation</span>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {/* Cours Dropdown */}
        <div ref={dropdownRef} onMouseMove={handleDropdownInteraction}>
          <button
            onClick={() => setCoursDropdownOpen(!coursDropdownOpen)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-body font-medium transition-all duration-200 w-full',
              isCoursActive
                ? 'gradient-muscle text-primary-foreground shadow-md shadow-primary/15'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <BookOpen className="w-[18px] h-[18px]" />
            <span className="flex-1 text-left">Cours</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform duration-300', coursDropdownOpen && 'rotate-180')} />
          </button>

          <div className={cn(
            'overflow-hidden transition-all duration-500 ease-in-out',
            coursDropdownOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
          )}>
            <div className="ml-4 pl-3 border-l-2 border-primary/15 space-y-0.5 py-1">
              <NavLink to="/admin/stages" end
                className={({ isActive }) => cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-body font-medium transition-all',
                  isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                )}>
                <Layers className="w-3.5 h-3.5" />
                Tous les Stages
              </NavLink>

              {stages.map(stage => (
                <NavLink key={stage.id} to={`/admin/stages/${stage.id}`}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-body font-medium transition-all',
                    isActive || location.pathname.startsWith(`/admin/stages/${stage.id}`)
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                  )}>
                  <FolderOpen className="w-3.5 h-3.5" />
                  {stage.code}
                  <span className="text-[10px] text-muted-foreground/60 ml-auto">{stage.name !== stage.code ? stage.name : ''}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {bottomLinks.map(link => (
          <NavLink key={link.to} to={link.to} end={false}
            className={({ isActive }) => linkClass(isActive)}>
            <link.icon className="w-[18px] h-[18px]" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-3">
        <div className="flex items-center gap-2 text-muted-foreground/30">
          <Heart className="w-3 h-3" />
          <div className="h-px flex-1 bg-border" />
          <Activity className="w-3 h-3" />
        </div>
      </div>

      <div className="p-3 mt-auto">
        <div className="p-3 rounded-xl bg-secondary/50">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-lg gradient-muscle flex items-center justify-center text-xs font-bold text-primary-foreground">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate font-body">{user?.fullName}</p>
              <p className="text-[10px] text-muted-foreground font-body">Administrateur</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 px-3 py-2 w-full text-[12px] text-muted-foreground hover:text-destructive rounded-lg transition-colors font-body">
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
}

