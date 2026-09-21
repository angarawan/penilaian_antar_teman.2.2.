export type UserRole = 'guru' | 'murid';

export interface UserProfile {
  uid: string;
  nama: string;
  email: string;
  password?: string;
  nip?: string;
  role: UserRole;
  kelas?: string;
  nomorAbsen?: string;
  nis?: string;
  fotoProfil?: string;
  status: 'aktif' | 'nonaktif';
  createdAt?: string;
}

export interface AppConfig {
  id?: string;
  appName: string;
  schoolName: string;
  motto: string;
  logoUrl?: string;
  logoIconPreset?: 'activity' | 'trophy' | 'medal' | 'flame' | 'basketball';
  updatedAt?: string;
}

export interface ClassItem {
  id: string;
  nama: string; // e.g. "XI 7", "X 1"
  tingkat: string; // "X", "XI", "XII"
  jurusan?: string;
  status: 'aktif' | 'nonaktif';
  createdAt?: string;
}

export interface ScaleDescriptions {
  1: string; // Default: "Perlu Bimbingan"
  2: string; // Default: "Mulai Berkembang"
  3: string; // Default: "Baik"
  4: string; // Default: "Sangat Baik"
}

export interface IndicatorItem {
  id: string;
  judulPenilaian: string;
  materi: string;
  indikator: string;
  urutan: number;
  status: 'aktif' | 'nonaktif';
  createdBy?: string;
  createdAt: string;
  skala?: ScaleDescriptions;
}

export interface AssessmentTask {
  id: string;
  nama: string; // "Penilaian Antar Teman Passing Bola Basket"
  materi: string; // "Passing Bola Basket"
  kelas: string; // "XI 7"
  tanggalMulai: string;
  batasWaktu: string;
  instruksi: string;
  indikatorIds: string[];
  jumlahTemanDinilai: number;
  bolehUploadVideo: boolean;
  bolehUploadFoto: boolean;
  wajibBukti: boolean;
  izinkanEdit: boolean;
  status: 'aktif' | 'draft' | 'selesai';
  createdAt: string;
}

export interface IndicatorScore {
  indicatorId: string;
  indicator: string;
  score: number; // 1 - 4
}

export interface AssessmentRecord {
  id: string;
  taskId: string;
  taskTitle?: string;
  materi?: string;
  assessorId: string;
  assessorUserId?: string; // alias
  assessorName: string;
  assessorClass: string;
  targetId: string;
  targetUserId?: string; // alias
  targetName: string;
  targetClass: string;
  evidenceType: 'video' | 'foto' | 'none';
  evidenceUrl?: string | null;
  evidencePath?: string;
  scores: IndicatorScore[];
  feedback: string;
  totalScore?: number;
  averageScore: number;
  finalScore100: number;
  status?: 'submitted' | string;
  createdAt: string;
  updatedAt?: string;
}

export interface AssessmentSummaryRow {
  studentId: string;
  nama: string;
  nis: string;
  kelas: string;
  noAbsen: string;
  jumlahPenilaianDiterima: number;
  jumlahPenilaianDiberikan: number;
  averageScore: number; // Skala 1 - 4
  finalScore100: number; // Skala 0 - 100
  statusPengerjaan: 'selesai' | 'sebagian' | 'belum';
}

export interface IndicatorAnalytics {
  indicatorId: string;
  indicator: string;
  rataRata: number;
  jumlahPenilai: number;
  distribusi: { [key: number]: number };
}
