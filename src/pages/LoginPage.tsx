import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DatabaseService } from '../services/db';
import { AppConfig } from '../types';
import { INITIAL_APP_CONFIG } from '../services/seedData';
import { AppLogo } from '../components/AppLogo';
import {
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();

  const [username, setUsername] = useState('guru');
  const [password, setPassword] = useState('guru123');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<AppConfig>(INITIAL_APP_CONFIG);

  useEffect(() => {
    DatabaseService.getAppConfig().then(setConfig);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Silakan masukkan username.');
      return;
    }
    if (!password) {
      setError('Silakan masukkan kata sandi.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const res = await login(username.trim(), password);
    setLoading(false);

    if (!res.success) {
      setError(res.message || 'Gagal masuk. Periksa kembali username dan kata sandi Anda.');
    } else {
      setSuccessMsg('Login berhasil! Mengalihkan...');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-blue-50/30 to-indigo-50/40 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Dynamic App Logo */}
        <div className="flex justify-center mb-3.5">
          <AppLogo size="xl" showText={false} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
          {config.appName || 'PENILAIAN ANTAR TEMAN PJOK'}
        </h1>
        <p className="mt-1 text-sm font-semibold text-blue-600">
          &ldquo;{config.motto || 'Sportif, Jujur, dan Menghargai Gerak Teman'}&rdquo;
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {config.schoolName || 'Pendidikan Jasmani, Olahraga, dan Kesehatan'}
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-6 sm:px-9 rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-100 space-y-5">
          {/* Feedback messages */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <strong className="block font-semibold">Gagal Masuk</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Login Tunggal (Username & Password) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/30 shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>MASUK</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

