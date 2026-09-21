/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { TeacherView } from './pages/TeacherView';
import { StudentView } from './pages/StudentView';
import { Activity } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/25 animate-pulse mb-4">
          <Activity className="w-9 h-9 animate-bounce" />
        </div>
        <p className="font-extrabold text-slate-800 text-lg font-heading tracking-tight">
          PENILAIAN ANTAR TEMAN PJOK
        </p>
        <p className="text-xs text-slate-500 mt-1">Memuat data pengguna...</p>
      </div>
    );
  }

  // If unauthenticated, show Login Page
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Role-Based View */}
      {user.role === 'guru' ? (
        <TeacherView
          isSidebarOpen={isSidebarOpen}
          onCloseSidebar={() => setIsSidebarOpen(false)}
        />
      ) : (
        <StudentView
          isSidebarOpen={isSidebarOpen}
          onCloseSidebar={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
