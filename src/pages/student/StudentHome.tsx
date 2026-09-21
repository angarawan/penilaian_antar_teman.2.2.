import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { AssessmentTask, AssessmentRecord } from '../../types';
import { StudentTab } from '../../components/StudentNav';
import {
  Sparkles,
  ClipboardList,
  CheckCircle2,
  Clock,
  ArrowRight,
  Award,
  Calendar,
  HeartHandshake,
  HelpCircle
} from 'lucide-react';

interface StudentHomeProps {
  onNavigateTab: (tab: StudentTab) => void;
  onStartAssessment: (task: AssessmentTask) => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  onNavigateTab,
  onStartAssessment
}) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AssessmentTask[]>([]);
  const [myAssessmentsGiven, setMyAssessmentsGiven] = useState<AssessmentRecord[]>([]);
  const [myAssessmentsReceived, setMyAssessmentsReceived] = useState<AssessmentRecord[]>([]);

  const loadData = async () => {
    if (!user) return;
    const [allTasks, allAssessments] = await Promise.all([
      DatabaseService.getTasks(),
      DatabaseService.getAssessments()
    ]);

    // Tasks for user's class
    const userClass = (user.kelas || 'XI 7').toLowerCase();
    const relevantTasks = allTasks.filter(
      (t) => t.kelas.toLowerCase() === userClass && t.status === 'aktif'
    );
    setTasks(relevantTasks);

    // Given by me
    const given = allAssessments.filter(
      (a) => a.assessorUserId === user.uid || a.assessorName.toLowerCase() === user.nama.toLowerCase()
    );
    setMyAssessmentsGiven(given);

    // Received by me
    const received = allAssessments.filter(
      (a) => a.targetUserId === user.uid || a.targetName.toLowerCase() === user.nama.toLowerCase()
    );
    setMyAssessmentsReceived(received);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, [user]);

  // Average score received by this student
  const avgReceived =
    myAssessmentsReceived.length > 0
      ? (
          myAssessmentsReceived.reduce((sum, item) => sum + (item.averageScore || 0), 0) /
          myAssessmentsReceived.length
        ).toFixed(2)
      : null;

  const score100Received = avgReceived ? Math.round((Number(avgReceived) / 4) * 100) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-tr from-indigo-700 via-blue-600 to-sky-500 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-lg shadow-indigo-600/15 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold mb-2 sm:mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Asesmen Formatif PJOK</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold font-heading tracking-tight leading-tight">
            Halo, {user?.nama}! 👋
          </h2>

          <p className="mt-1 text-xs sm:text-base text-blue-100">
            Siswa Kelas <strong className="text-white underline decoration-sky-300">{user?.kelas || 'XI 7'}</strong> (No. Absen {user?.nomorAbsen || '01'})
          </p>

          <p className="mt-2 text-xs sm:text-sm text-blue-100/90 italic leading-relaxed">
            &ldquo;Belajar menilai, belajar memperbaiki gerak bersama teman secara sportif dan objektif.&rdquo;
          </p>

          <div className="mt-4 sm:mt-5 flex flex-col xs:flex-row gap-2 sm:gap-2.5">
            <button
              onClick={() => onNavigateTab('tasks')}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 text-xs sm:text-sm font-bold shadow-md hover:bg-blue-50 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-indigo-600" />
              <span>Tugas Penilaian Saya</span>
            </button>
            <button
              onClick={() => onNavigateTab('history')}
              className="px-4 py-2.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-950/60 text-white text-xs sm:text-sm font-semibold backdrop-blur-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4 text-sky-300" />
              <span>Riwayat Penilaian</span>
            </button>
          </div>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-8 -bottom-8 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Telah Menilai
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 font-heading">
              {myAssessmentsGiven.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">Teman</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Dinilai Teman
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600 font-heading">
              {myAssessmentsReceived.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">Kali</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Rata-Rata Capaian
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 font-heading">
              {avgReceived || '—'}
            </span>
            {avgReceived && (
              <span className="text-xs font-bold text-blue-600">
                / 4 ({score100Received} / 100)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Active Tasks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 font-heading">
              Tugas Penilaian Aktif
            </h3>
            <p className="text-xs text-slate-500">
              Pilih tugas gerak yang ditugaskan guru untuk mengamati dan menilai gerakan temanmu
            </p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
            Saat ini belum ada tugas penilaian aktif untuk kelasmu.
          </div>
        ) : (
          tasks.map((task) => {
            const evaluatedCount = myAssessmentsGiven.filter((a) => a.taskId === task.id).length;
            const requiredCount = task.jumlahTemanDinilai || 2;
            const isCompleted = evaluatedCount >= requiredCount;

            return (
              <div
                key={task.id}
                className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold bg-blue-100 text-blue-900">
                      Kelas {task.kelas}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold bg-slate-100 text-slate-700">
                      {task.materi}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold flex items-center gap-1 ${
                        isCompleted
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Selesai ({evaluatedCount}/{requiredCount} Teman)</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Perlu Menilai ({evaluatedCount}/{requiredCount})</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-black text-slate-900 font-heading">
                    {task.nama}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    <strong className="text-slate-700">Instruksi: </strong>
                    {task.instruksi}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Batas: <strong className="text-slate-700">{task.batasWaktu}</strong>
                    </span>
                    <span>•</span>
                    <span>{task.indikatorIds.length} Indikator Gerak</span>
                  </div>
                </div>

                <div className="pt-2 sm:pt-0 shrink-0">
                  <button
                    onClick={() => onStartAssessment(task)}
                    className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <span>{isCompleted ? 'Nilai Teman Lain' : 'Mulai Menilai'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ethics & Peer Assessment Guide Card */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-linear-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200/70 shadow-xs flex items-start gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
          <HeartHandshake className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-extrabold text-slate-900 text-sm font-heading">
            Etika Penilaian Antar Teman PJOK
          </h4>
          <p className="text-slate-600 leading-relaxed">
            1. Amati gerakan teman dengan teliti sesuai <strong>rubrik kriteria guru</strong> secara jujur dan objektif.
          </p>
          <p className="text-slate-600 leading-relaxed">
            2. Berikan masukan yang <strong>santun, sportif, dan memotivasi</strong> agar teman sekelas berkembang bersama.
          </p>
        </div>
      </div>
    </div>
  );
};
