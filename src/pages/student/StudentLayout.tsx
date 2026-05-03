import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, ClipboardList, BarChart3, Home, LogOut, ChevronDown, Layers, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStages } from '@/lib/store';
import logoFar from '@/assets/logo-far.png';
import anatomyBg from '@/assets/anatomy-bg.png';

const mainLinks = [
  { to: '/student', icon: Home, label: 'Accueil' },
  { to: '/student/quizzes', icon: ClipboardList, label: 'Quiz' },
  { to: '/student/results', icon: BarChart3, label: 'Résultats' },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const stages = getStages();

  const selectedStage = new URLSearchParams(location.search).get('stage') || 'all';
  const isCoursesActive = location.pathname.startsWith('/student/courses');

  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(isCoursesActive);
  const coursesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCoursesActive) setCoursesDropdownOpen(true);
  }, [isCoursesActive]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!coursesDropdownRef.current) return;
      if (!coursesDropdownRef.current.contains(event.target as Node)) {
        setCoursesDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openStage = (stageId: string) => {
    if (stageId === 'all') {
      navigate('/student/courses');
    } else {
      navigate(`/student/courses?stage=${stageId}`);
    }
    setCoursesDropdownOpen(false);
  };

  const navClass = (isActive: boolean) => cn(
    'flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[14px] font-body font-semibold transition-all duration-200',
    isActive
      ? 'gradient-muscle text-primary-foreground shadow-sm'
      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
  );

  return (
    <div className="min-h-screen bg-background relative">
      {/* Full wallpaper */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img src={anatomyBg} alt="" className="w-full h-full object-cover opacity-[0.04]" />
      </div>

      <header className="border-b border-border sticky top-0 z-50 bg-card/85 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={logoFar} alt="FAR" className="w-8 h-8 object-contain" width={32} height={32} />
            <h1 className="font-display font-bold text-[16px] text-foreground">Centre Sportif FAR</h1>
          </div>

          <nav className="flex items-center gap-1">
            {mainLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/student'}
                className={({ isActive }) => navClass(isActive)}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </NavLink>
            ))}

            <div className="relative" ref={coursesDropdownRef}>
              <button
                onClick={() => setCoursesDropdownOpen(prev => !prev)}
                className={navClass(isCoursesActive)}
              >
                <BookOpen className="w-4 h-4" />
                Cours
                <ChevronDown className={cn('w-4 h-4 transition-transform', coursesDropdownOpen && 'rotate-180')} />
              </button>

              <div className={cn(
                'absolute top-[calc(100%+10px)] left-0 w-72 rounded-xl border border-border bg-card shadow-elevated z-50 transition-all duration-200 origin-top',
                coursesDropdownOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
              )}>
                <div className="px-3.5 py-2.5 border-b border-border">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-body">Cours par stage</p>
                </div>
                <div className="p-2 space-y-1 max-h-72 overflow-auto">
                  <button
                    onClick={() => openStage('all')}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-body text-left transition-colors',
                      selectedStage === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                    )}
                  >
                    <Layers className="w-4 h-4" />
                    Tous les stages
                  </button>

                  {stages.map(stage => (
                    <button
                      key={stage.id}
                      onClick={() => openStage(stage.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-body text-left transition-colors',
                        selectedStage === stage.id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                      )}
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>{stage.code}</span>
                      <span className="ml-auto text-[11px] text-muted-foreground/70">{stage.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-muscle flex items-center justify-center text-[11px] font-bold text-primary-foreground">
                {user?.fullName?.charAt(0)}
              </div>
              <span className="text-[14px] font-semibold font-body hidden sm:block">{user?.fullName}</span>
            </div>
            <button onClick={() => { logout(); navigate('/'); }} className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
