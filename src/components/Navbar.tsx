import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from './AppLogo';
import {
  LogOut,
  Menu,
  X,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { currentUser, role, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs w-full">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand / Logo - Rapat ke samping kiri tepat di atas sidebar */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-indigo-600 focus:outline-hidden cursor-pointer transition-colors lg:hidden"
                aria-label="Buka menu navigasi"
              >
                {isSidebarOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            )}

            <AppLogo size="md" showText={true} />
          </div>

          {/* User Session */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Current user badge */}
              <div className="flex items-center gap-2 sm:gap-2.5 pl-1.5 sm:pl-2">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white shadow-xs ${
                  role === 'guru' ? 'bg-indigo-600' : 'bg-blue-600'
                }`}>
                  {currentUser.nama.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">
                    {currentUser.nama}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    {role === 'guru' ? (
                      <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md font-semibold">
                        <ShieldCheck className="w-3 h-3" /> Guru PJOK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md font-semibold">
                        <GraduationCap className="w-3 h-3" /> {currentUser.kelas || 'Siswa'}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => logout()}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ml-1 sm:ml-2"
                  title="Keluar / Logout"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </header>
  );
};
