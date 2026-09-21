import React from 'react';
import { Home, ClipboardCheck, History, User } from 'lucide-react';

export type StudentTab = 'home' | 'tasks' | 'history' | 'profile';

interface StudentNavProps {
  currentTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  pendingTaskCount?: number;
}

export const StudentNav: React.FC<StudentNavProps> = ({
  currentTab,
  onSelectTab,
  pendingTaskCount = 0
}) => {
  const tabs: Array<{
    id: StudentTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'tasks', label: 'Tugas', icon: ClipboardCheck, badge: pendingTaskCount },
    { id: 'history', label: 'Riwayat', icon: History },
    { id: 'profile', label: 'Profil', icon: User }
  ];

  return (
    <>
      {/* Top / Desktop Segmented Nav for Student */}
      <div className="bg-white border-b border-slate-200/90 py-2.5 px-4 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-center sm:justify-start gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.badge && t.badge > 0 ? (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[11px] font-bold rounded-full ${
                      isActive ? 'bg-white text-blue-700' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {t.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Fixed Bar for easy thumb navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-4 h-16">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-all relative cursor-pointer active:scale-95 ${
                  isActive ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <div
                    className={`p-1 rounded-xl transition-all ${
                      isActive ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {t.badge && t.badge > 0 ? (
                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold shadow-xs">
                      {t.badge}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[11px] leading-tight ${isActive ? 'font-bold' : ''}`}>
                  {t.label}
                </span>
                {isActive && (
                  <span className="absolute top-0 w-8 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
