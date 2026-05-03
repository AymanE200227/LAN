import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, AlertCircle, Lock, User, Wifi, Activity, Heart, Bone } from 'lucide-react';
import logoFar from '@/assets/logo-far.png';
import anatomyBg from '@/assets/anatomy-bg.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = login(username, password);
    if (user) {
      navigate(user.role === 'admin' ? '/admin/stages' : '/student');
    } else {
      setError('Identifiants incorrects ou compte désactivé');
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      {/* Full wallpaper */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img src={anatomyBg} alt="" className="w-full h-full object-cover opacity-[0.05]" />
      </div>

      {/* Left branding */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

        {/* Floating anatomy icons */}
        <div className="absolute top-20 left-16 text-primary/10"><Heart className="w-12 h-12" /></div>
        <div className="absolute bottom-32 left-24 text-primary/8"><Bone className="w-10 h-10" /></div>
        <div className="absolute top-40 right-20 text-primary/6"><Activity className="w-14 h-14" /></div>

        <div className="relative z-10 max-w-md px-12">
          <div className="w-24 h-24 rounded-2xl bg-card shadow-card flex items-center justify-center mb-8">
            <img src={logoFar} alt="FAR" className="w-16 h-16 object-contain" width={64} height={64} />
          </div>
          <h1 className="text-5xl font-display font-800 leading-tight mb-4">
            <span className="text-muscle-gradient">Centre</span>
            <br />
            <span className="text-muscle-gradient">Sportif FAR</span>
          </h1>
          <p className="text-muted-foreground text-lg font-body leading-relaxed">
            Plateforme de formation et d'examens pour le développement sportif et médical.
          </p>
          <div className="flex items-center gap-3 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card shadow-sm border border-border">
              <Wifi className="w-3.5 h-3.5 text-success" />
              <span className="font-body text-[13px]">Réseau Local</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card shadow-sm border border-border">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="font-body text-[13px]">Sécurisé</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right login */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-card shadow-card flex items-center justify-center mx-auto mb-4">
              <img src={logoFar} alt="FAR" className="w-14 h-14 object-contain" width={56} height={56} />
            </div>
            <h1 className="text-2xl font-display font-bold text-muscle-gradient">Centre Sportif FAR</h1>
          </div>

          <div className="bg-card rounded-2xl shadow-elevated p-8 border border-border">
            <div className="mb-6">
              <h2 className="text-2xl font-display font-bold text-foreground">Connexion</h2>
              <p className="text-muted-foreground text-sm mt-1 font-body">Accédez à votre espace de formation</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground font-body">Identifiant</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Entrez votre identifiant"
                    className="pl-10 bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary/20 h-11 rounded-xl font-body"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground font-body">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary/20 h-11 rounded-xl font-body"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/5 p-3 rounded-xl border border-destructive/15">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11 gradient-muscle font-semibold text-primary-foreground hover:opacity-90 transition-all rounded-xl text-[15px] shadow-md shadow-primary/15">
                Se Connecter
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6 font-body">
              Admin: <span className="text-primary font-medium">admin / admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

