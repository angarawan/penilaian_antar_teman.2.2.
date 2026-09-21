import React from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentTab } from './StudentNav';
import {
  Home,
  ClipboardList,
  History,
  User,
  LogOut,
  X,
  HeartHandshake,
  Sparkles,
  GraduationCap
} from 'lucide-react';

interface StudentSidebarProps {
  currentTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingTaskCount?: number;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  pendingTaskCount = 0
}) => {
  const { user, logout } = useAuth();

  const menuItems: Array<{
    id: StudentTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    description: string;
  }> = [
    {
      id: 'home',
      label: 'Beranda',
      icon: Home,
      description: 'Ringkasan & status'
    },
    {
      id: 'tasks',
      label: 'Tugas Penilaian',
      icon: ClipboardList,
      badge: pendingTaskCount,
      description: 'Daftar praktik kelas'
    },
    {
      id: 'history',
      label: 'Riwayat & Masukan',
      icon: History,
      description: 'Nilai & umpan balik'
    },
    {
      id: 'profile',
      label: 'Profil & Panduan',
      icon: User,
      description: 'Data diri & etika'
    }
  ];

  const handleItemClick = (id: StudentTab) => {
    onSelectTab(id);
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
              MENU SISWA PJOK
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student Profile Info Card */}
          <div className="p-3.5 bg-linear-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100/80 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {user?.nama ? user.nama.charAt(0) : 'S'}
              </div>
              <div className="overflow-hidden">
                <p className="font-extrabold text-xs sm:text-sm text-slate-800 truncate">
                  {user?.nama || 'Siswa PJOK'}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>Kelas {user?.kelas || 'XI 7'}</span>
                  {user?.nomorAbsen && <span>• No. {user.nomorAbsen}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="space-y-1.5 py-1">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Menu Pembelajaran
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <div className="text-left">
                      <span className="block leading-tight">{item.label}</span>
                      <span
                        className={`text-[10px] font-normal ${
                          isActive ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {item.description}
                      </span>
                    </div>
                  </div>

                  {item.badge !== undefined && item.badge > 0 ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        isActive
                          ? 'bg-white text-blue-700'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Bottom Etika Card */}
          <div className="mt-auto pt-6">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <HeartHandshake className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Prinsip Menilai</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Jujur, santun, dan objektif sesuai rubrik gerak guru.
              </p>
            </div>

            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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
