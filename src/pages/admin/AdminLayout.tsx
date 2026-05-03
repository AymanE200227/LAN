import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/AdminSidebar';
import anatomyBg from '@/assets/anatomy-bg.png';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto relative">
        {/* Full wallpaper */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <img src={anatomyBg} alt="" className="w-full h-full object-cover opacity-[0.04]" />
        </div>
        <div className="relative z-10 p-8 max-w-[1200px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
