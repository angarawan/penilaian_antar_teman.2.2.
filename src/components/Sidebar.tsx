import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  School,
  CheckSquare,
  FileSpreadsheet,
  Award,
  BarChart3,
  Settings,
  LogOut,
  X,
  ClipboardList
} from 'lucide-react';

export type TeacherMenu =
  | 'dashboard'
  | 'students'
  | 'classes'
  | 'indicators'
  | 'tasks'
  | 'results'
  | 'recap'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  currentMenu: TeacherMenu;
  onSelectMenu: (menu: TeacherMenu) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isOpen,
  onClose
}) => {
  const { currentUser, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Data Murid', icon: Users },
    { id: 'classes', label: 'Data Kelas', icon: School },
    { id: 'indicators', label: 'Indikator Penilaian', icon: CheckSquare },
    { id: 'tasks', label: 'Tugas Penilaian', icon: ClipboardList },
    { id: 'results', label: 'Hasil Penilaian', icon: Award },
    { id: 'recap', label: 'Rekap Nilai', icon: FileSpreadsheet },
    { id: 'analytics', label: 'Analisis & Grafik', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan & DB', icon: Settings }
  ] as const;

  const handleItemClick = (id: TeacherMenu) => {
    onSelectMenu(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-20 z-40 h-screen lg:h-[calc(100vh-5rem)] w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 flex flex-col h-full overflow-y-auto">
          {/* Mobile header with close button */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 lg:hidden">
            <span className="font-extrabold text-sm text-slate-800 font-heading">
              MENU GURU PJOK
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Teacher Status Card above Menu Utama */}
          <div className="p-3 bg-linear-to-br from-indigo-50/90 to-blue-50/70 rounded-2xl border border-indigo-100/80 mb-3 hidden lg:flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {currentUser?.nama ? currentUser.nama.charAt(0) : 'G'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">
                {currentUser?.nama || 'Guru PJOK'}
              </p>
              <p className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Portal Guru Aktif
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1 py-1">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Menu Utama
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Card / Info */}
          <div className="mt-auto pt-6">
            <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 mb-3">
              <p className="text-xs font-bold text-indigo-950">Kurikulum Merdeka PJOK</p>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Model Asesmen Formatif Antar Teman (Peer Assessment)
              </p>
            </div>

            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
